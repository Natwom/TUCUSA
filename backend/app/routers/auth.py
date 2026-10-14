import re
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File, Request
from pydantic import EmailStr
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.core.security import hash_password, verify_password, create_access_token, DUMMY_HASH
from app.core.cloudinary_config import upload_image, delete_image
from app.core.config import settings
from app.core.rate_limit import rate_limit
from app.core.security_events import log_event, is_locked_out
from app.core.uploads import read_and_validate_image

router = APIRouter(prefix="/api/auth", tags=["Auth"])

PHONE_RE = re.compile(schemas.PHONE_PATTERN)
ADMISSION_RE = re.compile(r"^[A-Za-z0-9/\-_. ]{3,50}$")


def _bad(msg: str):
    raise HTTPException(status_code=400, detail=msg)


def _validate_password(pw: str):
    if len(pw) < 8:
        _bad("Password must be at least 8 characters")
    if len(pw.encode("utf-8")) > 72:
        _bad("Password is too long (max 72 characters)")
    if not re.search(r"[A-Za-z]", pw) or not re.search(r"\d", pw):
        _bad("Password must contain both letters and numbers")


def _find_user(db: Session, email: str):
    return db.query(models.User).filter(func.lower(models.User.email) == email).first()


def _locked_response(request: Request, email: str):
    log_event("login_blocked", "warning", request, email=email, detail="Lockout active, attempt rejected")
    raise HTTPException(
        status_code=429,
        detail=f"Too many failed attempts. Try again in {settings.LOCKOUT_WINDOW_MINUTES} minutes.",
        headers={"Retry-After": str(settings.LOCKOUT_WINDOW_MINUTES * 60)},
    )


@router.post(
    "/register",
    response_model=schemas.UserOut,
    dependencies=[Depends(rate_limit("register", 20, 3600))],
)
def register(
    request: Request,
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
    full_name, admission_number = full_name.strip(), admission_number.strip()
    course, constituency, phone = course.strip(), constituency.strip(), phone.strip()
    email = str(email).strip().lower()

    if not 2 <= len(full_name) <= 100:
        _bad("Full name must be 2-100 characters")
    if not ADMISSION_RE.match(admission_number):
        _bad("Invalid admission number")
    if not 2 <= len(course) <= 100:
        _bad("Course must be 2-100 characters")
    if not 1 <= len(constituency) <= 100:
        _bad("Constituency is required")
    if not 1 <= year_of_study <= 8:
        _bad("Invalid year of study")
    if not PHONE_RE.match(phone):
        _bad("Invalid phone number")
    _validate_password(password)

    if _find_user(db, email):
        _bad("Email already registered")
    if db.query(models.User).filter(models.User.admission_number == admission_number).first():
        _bad("Admission number already registered")

    # Validate real image content (magic bytes + size) BEFORE uploading anything
    national_bytes = read_and_validate_image(national_id, "National ID", request)
    student_bytes = read_and_validate_image(student_id, "Student ID", request)

    national_id_url = upload_image(national_bytes, folder="tucusa/ids/national")
    student_id_url = upload_image(student_bytes, folder="tucusa/ids/student")

    user = models.User(
        email=email,
        password_hash=hash_password(password),
        full_name=full_name,
        admission_number=admission_number,
        course=course,
        year_of_study=year_of_study,
        constituency=constituency,
        phone=phone,
        national_id_photo=national_id_url,
        student_id_photo=student_id_url,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        delete_image(national_id_url)
        delete_image(student_id_url)
        _bad("Email or admission number already registered")
    db.refresh(user)
    return user


@router.post(
    "/login",
    response_model=schemas.Token,
    dependencies=[Depends(rate_limit("login", 30, 60))],
)
def login(request: Request, credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    email = str(credentials.email).strip().lower()

    if is_locked_out(request, email):
        _locked_response(request, email)

    user = _find_user(db, email)
    # Always run a bcrypt verify so timing does not reveal whether the email exists
    password_ok = verify_password(credentials.password, user.password_hash if user else DUMMY_HASH)

    if not user or not password_ok:
        log_event(
            "login_failed", "warning", request, email=email, user_id=user.id if user else None,
            detail="unknown email" if not user else "wrong password",
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if user.role != "student":
        # Admin accounts must use /admin-login only
        log_event("login_failed", "warning", request, email=email, user_id=user.id,
                  detail="non-student account used voter login")
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        log_event("login_denied", "info", request, email=email, user_id=user.id, detail="deactivated account")
        raise HTTPException(status_code=403, detail="Account deactivated")
    if not user.is_approved:
        raise HTTPException(status_code=403, detail="Account pending admin approval")

    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role, "scope": "voter"},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post(
    "/admin-login",
    response_model=schemas.Token,
    dependencies=[Depends(rate_limit("admin-login", 10, 60))],
)
def admin_login(request: Request, credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    email = str(credentials.email).strip().lower()

    if is_locked_out(request, email):
        _locked_response(request, email)

    user = _find_user(db, email)
    password_ok = verify_password(credentials.password, user.password_hash if user else DUMMY_HASH)

    if not user or not password_ok:
        log_event(
            "admin_login_failed", "warning", request, email=email, user_id=user.id if user else None,
            detail="unknown email" if not user else "wrong password",
        )
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if user.role != "admin" or not user.is_active:
        log_event(
            "admin_login_failed", "critical", request, email=email, user_id=user.id,
            detail=f"valid credentials but role={user.role} active={user.is_active}",
        )
        raise HTTPException(status_code=401, detail="Invalid credentials")

    log_event("admin_login_success", "info", request, email=email, user_id=user.id, detail="Admin signed in")

    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role, "scope": "admin"},
        expires_delta=timedelta(minutes=settings.ADMIN_TOKEN_EXPIRE_MINUTES),
    )
    return {"access_token": access_token, "token_type": "bearer"}