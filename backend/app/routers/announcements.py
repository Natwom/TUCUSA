from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import get_current_active_user, require_admin

router = APIRouter(prefix="/api/announcements", tags=["Announcements"])


@router.post("/", response_model=schemas.AnnouncementOut)
def create_announcement(
    data: schemas.AnnouncementCreate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    announcement = models.Announcement(
        title=data.title,
        content=data.content,
        created_by=admin.id,
    )
    db.add(announcement)
    db.commit()
    db.refresh(announcement)
    return announcement


@router.get("/", response_model=list[schemas.AnnouncementOut])
def list_announcements(db: Session = Depends(get_db)):
    return db.query(models.Announcement).order_by(models.Announcement.created_at.desc()).all()


@router.delete("/{announcement_id}")
def delete_announcement(
    announcement_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    ann = db.query(models.Announcement).filter(models.Announcement.id == announcement_id).first()
    if ann:
        db.delete(ann)
        db.commit()
    return {"message": "Deleted"}