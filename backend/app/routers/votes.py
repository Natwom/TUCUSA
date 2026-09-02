from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.database import get_db
from app import models, schemas
from app.auth import get_current_active_user

router = APIRouter(prefix="/api/votes", tags=["Votes"])


def ensure_utc(dt: datetime) -> datetime:
    """Normalize a datetime to UTC-aware. Handles naive datetimes from SQLite."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


@router.post("/", response_model=schemas.VoteOut)
def cast_vote(
    data: schemas.VoteCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can vote")
    if not current_user.is_approved:
        raise HTTPException(status_code=403, detail="Account not approved")

    election = db.query(models.Election).filter(models.Election.id == data.election_id).first()
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")

    now = datetime.now(timezone.utc)
    start = ensure_utc(election.start_time)
    end = ensure_utc(election.end_time)
    if now < start or now > end:
        raise HTTPException(status_code=400, detail="Voting is not open for this election")
    if election.status != "active":
        raise HTTPException(status_code=400, detail="Election is not active")

    existing = (
        db.query(models.Vote)
        .filter(models.Vote.election_id == data.election_id, models.Vote.user_id == current_user.id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="You have already voted in this election")

    vote = models.Vote(
        election_id=data.election_id,
        candidate_id=data.candidate_id,
        user_id=current_user.id,
    )
    candidate = db.query(models.Candidate).filter(models.Candidate.id == data.candidate_id).first()
    if candidate:
        candidate.votes_count += 1

    db.add(vote)
    db.commit()
    db.refresh(vote)
    return vote


@router.get("/election/{election_id}/results", response_model=schemas.ElectionResult)
def get_results(election_id: int, db: Session = Depends(get_db)):
    election = db.query(models.Election).filter(models.Election.id == election_id).first()
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")

    candidates = db.query(models.Candidate).filter(models.Candidate.election_id == election_id).all()
    total_votes = sum(c.votes_count for c in candidates)

    candidate_results = []
    for c in candidates:
        pct = (c.votes_count / total_votes * 100) if total_votes > 0 else 0
        candidate_results.append(
            schemas.CandidateResult(
                candidate_id=c.id,
                name=c.name,
                photo_url=c.photo_url,
                votes_count=c.votes_count,
                percentage=round(pct, 2),
            )
        )

    return schemas.ElectionResult(
        election_id=election.id,
        title=election.title,
        total_votes=total_votes,
        candidates=candidate_results,
    )


@router.get("/election/{election_id}/has-voted")
def has_voted(
    election_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    vote = (
        db.query(models.Vote)
        .filter(models.Vote.election_id == election_id, models.Vote.user_id == current_user.id)
        .first()
    )
    return {"has_voted": vote is not None}