import os
import shutil
from pathlib import Path
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import require_admin

router = APIRouter(prefix="/api/candidates", tags=["Candidates"])

UPLOAD_DIR = Path("uploads/candidates")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

VALID_IMAGE_TYPES = {"image/jpeg", "image/png", "image/jpg", "image/webp"}


def save_upload_file(upload_file: UploadFile) -> str:
    file_ext = os.path.splitext(upload_file.filename)[1]
    file_name = f"{uuid4()}{file_ext}"
    file_path = UPLOAD_DIR / file_name
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)
    return f"/uploads/candidates/{file_name}"


@router.post("/", response_model=schemas.CandidateOut)
def create_candidate(
    election_id: int = Form(...),
    name: str = Form(...),
    manifesto: str = Form(""),
    photo: UploadFile = File(None),
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    election = db.query(models.Election).filter(models.Election.id == election_id).first()
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")

    if photo and photo.content_type not in VALID_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Invalid image format. Only JPEG, PNG, WEBP allowed.")

    photo_path = save_upload_file(photo) if photo else None

    candidate = models.Candidate(
        election_id=election_id,
        name=name,
        photo_url=photo_path,
        manifesto=manifesto,
    )
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    return candidate


@router.get("/election/{election_id}", response_model=list[schemas.CandidateOut])
def get_candidates(election_id: int, db: Session = Depends(get_db)):
    return db.query(models.Candidate).filter(models.Candidate.election_id == election_id).all()


@router.put("/{candidate_id}", response_model=schemas.CandidateOut)
def update_candidate(
    candidate_id: int,
    name: str = Form(None),
    manifesto: str = Form(None),
    photo: UploadFile = File(None),
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    candidate = db.query(models.Candidate).filter(models.Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    if photo:
        if photo.content_type not in VALID_IMAGE_TYPES:
            raise HTTPException(status_code=400, detail="Invalid image format. Only JPEG, PNG, WEBP allowed.")
        # Optional: delete old photo
        if candidate.photo_url:
            old_path = Path(candidate.photo_url.lstrip("/"))
            if old_path.exists():
                old_path.unlink()
        candidate.photo_url = save_upload_file(photo)

    if name is not None:
        candidate.name = name
    if manifesto is not None:
        candidate.manifesto = manifesto

    db.commit()
    db.refresh(candidate)
    return candidate


@router.delete("/{candidate_id}")
def delete_candidate(
    candidate_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    candidate = db.query(models.Candidate).filter(models.Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Optional: delete photo file
    if candidate.photo_url:
        file_path = Path(candidate.photo_url.lstrip("/"))
        if file_path.exists():
            file_path.unlink()
    
    db.delete(candidate)
    db.commit()
    return {"message": "Candidate deleted"}