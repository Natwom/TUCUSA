import os
import shutil
from pathlib import Path
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, status, Form, UploadFile, File
from pydantic import EmailStr
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.core.security import hash_password, verify_password, create_access_token
from datetime import timedelta
from app.core.config import settings

router = APIRouter(prefix="/api/auth", tags=["Auth"])

# ID upload directories
NATIONAL_ID_DIR = Path("uploads/ids/national")
STUDENT_ID_DIR = Path("uploads/ids/student")
NATIONAL_ID_DIR.mkdir(parents=True, exist_ok=True)
STUDENT_ID_DIR.mkdir(parents=True, exist_ok=True)

VALID_IMAGE_TYPES = {"image/jpeg", "image/png", "image/jpg", "image/webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


def save_id_file(upload_file: UploadFile, save_dir: Path) -> str:
    file_ext = os.path.splitext(upload_file.filename)[1]
    file_name = f"{uuid4()}{file_ext}"
    file_path = save_dir / file_name
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)
    return f"/uploads/ids/{save_dir.name}/{file_name}"


@router.post("/register", response_model=schemas.UserOut)
def register(
    full_name: str = Form(...),
    admission_number: str = Form(...),
    course: str = Form(...),
    year_of_study: int = Form(...),
    constituency: str = Form(...),
    email: EmailStr = Form(...),
    phone: str = Form(...),
    password: str = Form(...),
    national_id: UploadFile = File(...),
    student_id: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    # Validate duplicates
    if db.query(models.User).filter(models.User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(models.User).filter(models.User.admission_number == admission_number).first():
        raise HTTPException(status_code=400, detail="Admission number already registered")

    # Validate ID files
    for file, label in [(national_id, "National ID"), (student_id, "Student ID")]:
        if file.content_type not in VALID_IMAGE_TYPES:
            raise HTTPException(status_code=400, detail=f"{label} must be an image (JPEG, PNG, WEBP)")
        # Size check (approximate via reading)
        file.file.seek(0, os.SEEK_END)
        size = file.file.tell()
        file.file.seek(0)
        if size > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail=f"{label} must be less than 5MB")

    # Save files
    national_id_path = save_id_file(national_id, NATIONAL_ID_DIR)
    student_id_path = save_id_file(student_id, STUDENT_ID_DIR)

    user = models.User(
        email=email,
        password_hash=hash_password(password),
        full_name=full_name,
        admission_number=admission_number,
        course=course,
        year_of_study=year_of_study,
        constituency=constituency,
        phone=phone,
        national_id_photo=national_id_path,
        student_id_photo=student_id_path,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=schemas.Token)
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account deactivated")
    if user.role == "student" and not user.is_approved:
        raise HTTPException(status_code=403, detail="Account pending admin approval")

    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/admin-login", response_model=schemas.Token)
def admin_login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Not an admin account")

    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {"access_token": access_token, "token_type": "bearer"}