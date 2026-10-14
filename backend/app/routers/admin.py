from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.auth import require_admin
from app.core.security_events import log_event

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/stats", response_model=schemas.AdminStats)
def get_stats(db: Session = Depends(get_db), admin: models.User = Depends(require_admin)):
    total_students = db.query(models.User).filter(models.User.role == "student").count()
    total_votes = db.query(models.Vote).count()
    active_elections = db.query(models.Election).filter(models.Election.status == "active").count()
    pending = db.query(models.User).filter(models.User.role == "student", models.User.is_approved == False).count()  # noqa: E712

    return schemas.AdminStats(
        total_students=total_students,
        total_votes_cast=total_votes,
        active_elections=active_elections,
        pending_approvals=pending,
    )


@router.get("/security-events", response_model=list[schemas.SecurityEventOut])
def list_security_events(
    severity: Optional[str] = None,
    event_type: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    q = db.query(models.SecurityEvent)
    if severity:
        q = q.filter(models.SecurityEvent.severity == severity)
    if event_type:
        q = q.filter(models.SecurityEvent.event_type == event_type)
    return q.order_by(models.SecurityEvent.created_at.desc()).offset(offset).limit(limit).all()


@router.get("/security-events/summary")
def security_summary(db: Session = Depends(get_db), admin: models.User = Depends(require_admin)):
    since = datetime.now(timezone.utc) - timedelta(hours=24)
    rows = (
        db.query(models.SecurityEvent.event_type, models.SecurityEvent.severity, func.count(models.SecurityEvent.id))
        .filter(models.SecurityEvent.created_at >= since)
        .group_by(models.SecurityEvent.event_type, models.SecurityEvent.severity)
        .all()
    )
    by_type, critical, warning = {}, 0, 0
    for event_type, severity, n in rows:
        by_type[event_type] = by_type.get(event_type, 0) + n
        if severity == "critical":
            critical += n
        elif severity == "warning":
            warning += n
    return {"last_24h": {"total": sum(by_type.values()), "critical": critical, "warning": warning, "by_type": by_type}}


@router.get("/integrity-check")
def integrity_check(
    request: Request,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    """Compares each candidate's cached votes_count with the real number of rows in `votes`."""
    actual = dict(
        db.query(models.Vote.candidate_id, func.count(models.Vote.id)).group_by(models.Vote.candidate_id).all()
    )
    mismatches = []
    for c in db.query(models.Candidate).all():
        real = actual.get(c.id, 0)
        if real != (c.votes_count or 0):
            mismatches.append({"candidate_id": c.id, "name": c.name, "stored": c.votes_count, "actual": real})
    if mismatches:
        log_event("integrity_mismatch", "critical", request, email=admin.email, user_id=admin.id,
                  detail=f"{len(mismatches)} candidate(s) have vote counts that do not match the votes table")
    return {"ok": not mismatches, "mismatches": mismatches}