from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import get_current_active_user, require_admin
from app.core.security_events import log_event

router = APIRouter(prefix="/api/students", tags=["Students"])


@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(get_current_active_user)):
    return current_user


@router.put("/me", response_model=schemas.UserOut)
def update_me(
    update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    # UserUpdate only contains harmless profile fields: role/is_approved/email cannot be changed here
    for field, value in update.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/voter-card", response_model=schemas.VoterCardOut)
def get_voter_card(current_user: models.User = Depends(get_current_active_user)):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students have voter cards")
    if not current_user.is_approved:
        raise HTTPException(status_code=403, detail="Account not yet approved")
    return current_user


@router.get("/", response_model=list[schemas.UserOut])
def list_students(
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
    approved_only: bool = False,
):
    query = db.query(models.User).filter(models.User.role == "student")
    if approved_only:
        query = query.filter(models.User.is_approved == True)  # noqa: E712
    return query.order_by(models.User.created_at.desc()).all()


@router.post("/{student_id}/approve")
def approve_student(
    student_id: int,
    request: Request,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    student = db.query(models.User).filter(models.User.id == student_id, models.User.role == "student").first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    student.is_approved = True
    db.commit()
    log_event("student_approved", "info", request, email=admin.email, user_id=admin.id,
              detail=f"approved student id={student_id} ({student.admission_number})")
    return {"message": "Student approved", "unique_voter_id": student.unique_voter_id}


@router.post("/{student_id}/reject")
def reject_student(
    student_id: int,
    request: Request,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    student = db.query(models.User).filter(models.User.id == student_id, models.User.role == "student").first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    student.is_active = False
    db.commit()
    log_event("student_rejected", "info", request, email=admin.email, user_id=admin.id,
              detail=f"rejected student id={student_id} ({student.admission_number})")
    return {"message": "Student rejected and deactivated"}