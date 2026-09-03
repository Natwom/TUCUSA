from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import require_admin
from app.core.cloudinary_config import upload_image, delete_image

router = APIRouter(prefix="/api/candidates", tags=["Candidates"])

VALID_IMAGE_TYPES = {"image/jpeg", "image/png", "image/jpg", "image/webp"}


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

    photo_url = upload_image(photo.file, folder="tucusa/candidates") if photo else None

    candidate = models.Candidate(
        election_id=election_id,
        name=name,
        photo_url=photo_url,
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
        if candidate.photo_url and candidate.photo_url.startswith("http"):
            delete_image(candidate.photo_url)
        candidate.photo_url = upload_image(photo.file, folder="tucusa/candidates")

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

    if candidate.photo_url and candidate.photo_url.startswith("http"):
        delete_image(candidate.photo_url)

    db.delete(candidate)
    db.commit()
    return {"message": "Candidate deleted"}