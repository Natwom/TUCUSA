from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app import models, schemas
from app.auth import require_admin

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/stats", response_model=schemas.AdminStats)
def get_stats(db: Session = Depends(get_db), admin: models.User = Depends(require_admin)):
    total_students = db.query(models.User).filter(models.User.role == "student").count()
    total_votes = db.query(models.Vote).count()
    active_elections = db.query(models.Election).filter(models.Election.status == "active").count()
    pending = db.query(models.User).filter(models.User.role == "student", models.User.is_approved == False).count()

    return schemas.AdminStats(
        total_students=total_students,
        total_votes_cast=total_votes,
        active_elections=active_elections,
        pending_approvals=pending,
    )