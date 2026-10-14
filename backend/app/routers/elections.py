from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.database import get_db
from app import models, schemas
from app.auth import get_current_active_user, require_admin
from app.core.security_events import log_event
from app.core.time_utils import ensure_utc, sync_election_status

router = APIRouter(prefix="/api/elections", tags=["Elections"])


@router.post("/", response_model=schemas.ElectionOut)
def create_election(
    request: Request,
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
    election.status = "upcoming"
    db.add(election)
    db.commit()
    db.refresh(election)

    if sync_election_status(election):
        db.commit()
        db.refresh(election)

    log_event("election_created", "info", request, email=admin.email, user_id=admin.id,
              detail=f"election id={election.id} '{election.title}'")
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
    request: Request,
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

    if "status" not in update_data:
        sync_election_status(election)

    db.commit()
    db.refresh(election)
    log_event("election_updated", "warning" if {"start_time", "end_time", "status"} & set(update_data) else "info",
              request, email=admin.email, user_id=admin.id,
              detail=f"election id={election_id} fields changed: {', '.join(update_data.keys())}")
    return election


@router.delete("/{election_id}")
def delete_election(
    election_id: int,
    request: Request,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    election = db.query(models.Election).filter(models.Election.id == election_id).first()
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")
    title = election.title
    vote_count = db.query(models.Vote).filter(models.Vote.election_id == election_id).count()
    db.delete(election)
    db.commit()
    log_event("election_deleted", "critical", request, email=admin.email, user_id=admin.id,
              detail=f"election id={election_id} '{title}' deleted (had {vote_count} vote(s))")
    return {"message": "Election deleted"}


@router.post("/{election_id}/start")
def start_election(
    election_id: int,
    request: Request,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    """Manual override: force an election active right now."""
    election = db.query(models.Election).filter(models.Election.id == election_id).first()
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")

    now = datetime.now(timezone.utc)
    if ensure_utc(election.start_time) > now:
        election.start_time = now
    election.status = "active"
    db.commit()
    log_event("election_started", "info", request, email=admin.email, user_id=admin.id,
              detail=f"election id={election_id} started manually")
    return {"message": "Election started"}


@router.post("/{election_id}/stop")
def stop_election(
    election_id: int,
    request: Request,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    """Manual override: force an election closed right now."""
    election = db.query(models.Election).filter(models.Election.id == election_id).first()
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")

    now = datetime.now(timezone.utc)
    if ensure_utc(election.end_time) > now:
        election.end_time = now
    election.status = "closed"
    db.commit()
    log_event("election_stopped", "warning", request, email=admin.email, user_id=admin.id,
              detail=f"election id={election_id} stopped manually")
    return {"message": "Election stopped"}