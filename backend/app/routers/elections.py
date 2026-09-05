from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.database import get_db
from app import models, schemas
from app.auth import get_current_active_user, require_admin
from app.core.time_utils import ensure_utc, sync_election_status

router = APIRouter(prefix="/api/elections", tags=["Elections"])


@router.post("/", response_model=schemas.ElectionOut)
def create_election(
    data: schemas.ElectionCreate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    start = ensure_utc(data.start_time)
    end = ensure_utc(data.end_time)
    if end <= start:
        raise HTTPException(status_code=400, detail="End time must be after start time")

    election = models.Election(
        title=data.title,
        position=data.position,
        description=data.description,
        start_time=start,
        end_time=end,
        created_by=admin.id,
    )
    # Set the correct initial status immediately, based on the times just given,
    # instead of always defaulting to "upcoming" and waiting for a later request
    # to fix it.
    election.status = "upcoming"
    db.add(election)
    db.commit()
    db.refresh(election)

    if sync_election_status(election):
        db.commit()
        db.refresh(election)

    return election


@router.get("/", response_model=list[schemas.ElectionOut])
def list_elections(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    elections = db.query(models.Election).order_by(models.Election.created_at.desc()).all()
    now = datetime.now(timezone.utc)
    changed = False
    for e in elections:
        if sync_election_status(e, now=now):
            changed = True
    if changed:
        db.commit()
    return elections


@router.get("/active", response_model=list[schemas.ElectionOut])
def active_elections(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    all_elections = db.query(models.Election).all()
    result = []
    changed = False
    for e in all_elections:
        # IMPORTANT: sync status here too. Previously this endpoint only
        # trusted the stored `status` column, which could still say
        # "upcoming" even after start_time had passed if nothing else had
        # refreshed it yet. That mismatch is what caused elections that were
        # clearly within their time window to be excluded here (or, on the
        # flip side, to pass this endpoint but still fail the status check
        # inside cast_vote).
        if sync_election_status(e, now=now):
            changed = True
        if e.status == "active":
            result.append(e)
    if changed:
        db.commit()
    return result


@router.get("/{election_id}", response_model=schemas.ElectionOut)
def get_election(election_id: int, db: Session = Depends(get_db)):
    election = db.query(models.Election).filter(models.Election.id == election_id).first()
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")

    if sync_election_status(election):
        db.commit()
        db.refresh(election)

    return election


@router.put("/{election_id}", response_model=schemas.ElectionOut)
def update_election(
    election_id: int,
    data: schemas.ElectionUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    election = db.query(models.Election).filter(models.Election.id == election_id).first()
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field in ("start_time", "end_time") and isinstance(value, datetime):
            value = ensure_utc(value)
        setattr(election, field, value)

    # If the admin changed start_time/end_time (and did not explicitly set a
    # status in the same request), immediately recompute status so the UI and
    # cast_vote() agree with the new schedule right away.
    if "status" not in update_data:
        sync_election_status(election)

    db.commit()
    db.refresh(election)
    return election


@router.delete("/{election_id}")
def delete_election(
    election_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    election = db.query(models.Election).filter(models.Election.id == election_id).first()
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")
    db.delete(election)
    db.commit()
    return {"message": "Election deleted"}


@router.post("/{election_id}/start")
def start_election(
    election_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    """
    Manual override: force an election active right now, regardless of its
    scheduled start_time. NOTE: because status is normally re-derived from
    start_time/end_time on every read (see sync_election_status), this manual
    override will be re-evaluated the next time the election is fetched. If
    you want a manual start to "stick" even before start_time, also pull
    start_time back to now here.
    """
    election = db.query(models.Election).filter(models.Election.id == election_id).first()
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")

    now = datetime.now(timezone.utc)
    if ensure_utc(election.start_time) > now:
        election.start_time = now
    election.status = "active"
    db.commit()
    return {"message": "Election started"}


@router.post("/{election_id}/stop")
def stop_election(
    election_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    """
    Manual override: force an election closed right now, regardless of its
    scheduled end_time. We also pull end_time back to now so that
    sync_election_status() (used elsewhere) agrees with this and doesn't flip
    it back to "active" on a later read.
    """
    election = db.query(models.Election).filter(models.Election.id == election_id).first()
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")

    now = datetime.now(timezone.utc)
    if ensure_utc(election.end_time) > now:
        election.end_time = now
    election.status = "closed"
    db.commit()
    return {"message": "Election stopped"}