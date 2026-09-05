from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.database import get_db
from app import models, schemas
from app.auth import get_current_active_user, require_admin

router = APIRouter(prefix="/api/elections", tags=["Elections"])


def ensure_utc(dt: datetime) -> datetime:
    """Normalize a datetime to UTC-aware. Handles naive datetimes from SQLite."""
    if dt is None:
        return dt
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


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
    db.add(election)
    db.commit()
    db.refresh(election)
    return election


@router.get("/", response_model=list[schemas.ElectionOut])
def list_elections(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    elections = db.query(models.Election).order_by(models.Election.created_at.desc()).all()
    now = datetime.now(timezone.utc)
    for e in elections:
        start = ensure_utc(e.start_time)
        end = ensure_utc(e.end_time)
        if e.status == "upcoming" and start <= now:
            e.status = "active"
        if e.status == "active" and end <= now:
            e.status = "closed"
    db.commit()
    return elections


@router.get("/active", response_model=list[schemas.ElectionOut])
def active_elections(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    # Filter in Python to avoid SQL-level naive/aware datetime crashes with SQLite
    all_elections = db.query(models.Election).all()
    result = []
    for e in all_elections:
        start = ensure_utc(e.start_time)
        end = ensure_utc(e.end_time)
        if start <= now and end > now and e.status == "active":
            result.append(e)
    return result


@router.get("/{election_id}", response_model=schemas.ElectionOut)
def get_election(election_id: int, db: Session = Depends(get_db)):
    election = db.query(models.Election).filter(models.Election.id == election_id).first()
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")

    # Auto-update status based on current time (same logic as list_elections)
    now = datetime.now(timezone.utc)
    start = ensure_utc(election.start_time)
    end = ensure_utc(election.end_time)
    updated = False
    if election.status == "upcoming" and start <= now:
        election.status = "active"
        updated = True
    if election.status == "active" and end <= now:
        election.status = "closed"
        updated = True
    if updated:
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
        # Normalize any datetime fields passed in the update
        if field in ("start_time", "end_time") and isinstance(value, datetime):
            value = ensure_utc(value)
        setattr(election, field, value)
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
    election = db.query(models.Election).filter(models.Election.id == election_id).first()
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")
    election.status = "active"
    db.commit()
    return {"message": "Election started"}


@router.post("/{election_id}/stop")
def stop_election(
    election_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    election = db.query(models.Election).filter(models.Election.id == election_id).first()
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")
    election.status = "closed"
    db.commit()
    return {"message": "Election stopped"}