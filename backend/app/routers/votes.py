from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database import get_db
from app import models, schemas
from app.auth import get_current_active_user
from app.core.rate_limit import limiter
from app.core.security_events import log_event
from app.core.time_utils import ensure_utc, sync_election_status

router = APIRouter(prefix="/api/votes", tags=["Votes"])


@router.post("/", response_model=schemas.VoteOut)
def cast_vote(
    request: Request,
    data: schemas.VoteCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    uid, uemail = current_user.id, current_user.email

    if not limiter.hit(f"vote:{uid}", 10, 60):
        if limiter.hit(f"vote-log:{uid}", 1, 60):
            log_event("rate_limited", "warning", request, email=uemail, user_id=uid, detail="vote endpoint flooded")
        raise HTTPException(status_code=429, detail="Too many requests. Please wait a moment.")

    if current_user.role != "student":
        log_event("vote_denied", "warning", request, email=uemail, user_id=uid, detail="non-student tried to vote")
        raise HTTPException(status_code=403, detail="Only students can vote")
    if not current_user.is_approved:
        log_event("vote_denied", "warning", request, email=uemail, user_id=uid, detail="unapproved account tried to vote")
        raise HTTPException(status_code=403, detail="Account not approved")

    election = db.query(models.Election).filter(models.Election.id == data.election_id).first()
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")

    now = datetime.now(timezone.utc)
    start = ensure_utc(election.start_time)
    end = ensure_utc(election.end_time)

    # Refresh the status column from the real start/end times before checking it.
    if sync_election_status(election, now=now):
        db.commit()
        db.refresh(election)
        start = ensure_utc(election.start_time)
        end = ensure_utc(election.end_time)

    if now < start:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Voting has not started yet for this election. "
                f"It opens at {start.isoformat()} (UTC). Current time: {now.isoformat()} (UTC)."
            ),
        )

    if now >= end:
        log_event("vote_after_close", "info", request, email=uemail, user_id=uid,
                  detail=f"election {data.election_id} already closed")
        raise HTTPException(
            status_code=400,
            detail=(
                f"Voting has closed for this election. "
                f"It ended at {end.isoformat()} (UTC). Current time: {now.isoformat()} (UTC)."
            ),
        )

    if election.status != "active":
        raise HTTPException(status_code=400, detail="Election is not active")

    existing = (
        db.query(models.Vote)
        .filter(models.Vote.election_id == data.election_id, models.Vote.user_id == uid)
        .first()
    )
    if existing:
        log_event("duplicate_vote_attempt", "warning", request, email=uemail, user_id=uid,
                  detail=f"election {data.election_id}")
        raise HTTPException(status_code=400, detail="You have already voted in this election")

    candidate = db.query(models.Candidate).filter(
        models.Candidate.id == data.candidate_id,
        models.Candidate.election_id == data.election_id,
    ).first()
    if not candidate:
        log_event("vote_denied", "warning", request, email=uemail, user_id=uid,
                  detail=f"candidate {data.candidate_id} does not belong to election {data.election_id}")
        raise HTTPException(status_code=404, detail="Candidate not found for this election")
    candidate_id = candidate.id

    vote = models.Vote(election_id=data.election_id, candidate_id=candidate_id, user_id=uid)
    db.add(vote)
    try:
        # The DB unique constraint (election_id, user_id) is the real double-vote guard.
        # It also catches two simultaneous requests that both passed the check above.
        db.flush()
    except IntegrityError:
        db.rollback()
        log_event("duplicate_vote_attempt", "warning", request, email=uemail, user_id=uid,
                  detail=f"election {data.election_id} (race/concurrent request blocked by DB)")
        raise HTTPException(status_code=400, detail="You have already voted in this election")

    # Atomic increment (no read-modify-write race)
    db.query(models.Candidate).filter(models.Candidate.id == candidate_id).update(
        {models.Candidate.votes_count: models.Candidate.votes_count + 1},
        synchronize_session=False,
    )
    db.commit()
    db.refresh(vote)
    return vote


@router.get("/election/{election_id}/results", response_model=schemas.ElectionResult)
def get_results(election_id: int, db: Session = Depends(get_db)):
    election = db.query(models.Election).filter(models.Election.id == election_id).first()
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")

    candidates = db.query(models.Candidate).filter(models.Candidate.election_id == election_id).all()

    # Count from the votes table itself (source of truth), not the cached votes_count column
    actual = dict(
        db.query(models.Vote.candidate_id, func.count(models.Vote.id))
        .filter(models.Vote.election_id == election_id)
        .group_by(models.Vote.candidate_id)
        .all()
    )
    total_votes = sum(actual.get(c.id, 0) for c in candidates)

    candidate_results = []
    for c in candidates:
        n = actual.get(c.id, 0)
        pct = (n / total_votes * 100) if total_votes > 0 else 0
        candidate_results.append(
            schemas.CandidateResult(
                candidate_id=c.id,
                name=c.name,
                photo_url=c.photo_url,
                votes_count=n,
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