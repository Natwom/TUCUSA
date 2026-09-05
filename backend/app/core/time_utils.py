"""
backend/app/core/time_utils.py

Shared datetime/status helpers so that election status is computed the SAME
way everywhere (elections.py, votes.py, admin panel views). This removes the
bug where a stale `status` column ("upcoming") could block voting even though
the current time is inside the admin-set start_time/end_time window.
"""

from datetime import datetime, timezone


def ensure_utc(dt: datetime) -> datetime:
    """Normalize a datetime to UTC-aware. Handles naive datetimes from SQLite."""
    if dt is None:
        return dt
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def compute_status(start_time: datetime, end_time: datetime, now: datetime = None) -> str:
    """
    Pure function: given start/end times, return what the status SHOULD be
    right now. Time is the single source of truth for upcoming/active/closed.
    """
    if now is None:
        now = datetime.now(timezone.utc)

    start = ensure_utc(start_time)
    end = ensure_utc(end_time)

    if now < start:
        return "upcoming"
    if start <= now < end:
        return "active"
    return "closed"


def sync_election_status(election, now: datetime = None) -> bool:
    """
    Recompute `election.status` from its start_time/end_time and update the
    object in place if it has drifted. Does NOT commit — caller is responsible
    for db.commit() (or leaving it to SQLAlchemy's autoflush if appropriate).

    Returns True if the status changed.
    """
    new_status = compute_status(election.start_time, election.end_time, now=now)
    if election.status != new_status:
        election.status = new_status
        return True
    return False