from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base
import secrets


def generate_voter_id():
    return f"TUCUSA-VOTE-{secrets.token_hex(3).upper()}"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    admission_number = Column(String, unique=True, index=True, nullable=False)
    course = Column(String, nullable=False)
    year_of_study = Column(Integer, nullable=False)
    phone = Column(String, nullable=False)
    constituency = Column(String, nullable=False)
    national_id_photo = Column(String, default=None)
    student_id_photo = Column(String, default=None)
    profile_picture = Column(String, default=None)
    role = Column(String, default="student")
    is_active = Column(Boolean, default=True)
    is_approved = Column(Boolean, default=False)
    unique_voter_id = Column(String, unique=True, index=True, default=generate_voter_id)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    votes = relationship("Vote", back_populates="user")


class Election(Base):
    __tablename__ = "elections"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    position = Column(String, nullable=False)
    description = Column(Text, default="")
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    status = Column(String, default="upcoming")
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    candidates = relationship("Candidate", back_populates="election", cascade="all, delete-orphan")


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    election_id = Column(Integer, ForeignKey("elections.id"), nullable=False)
    name = Column(String, nullable=False)
    photo_url = Column(String, default=None)
    manifesto = Column(Text, default="")
    votes_count = Column(Integer, default=0)

    election = relationship("Election", back_populates="candidates")
    votes = relationship("Vote", back_populates="candidate", cascade="all, delete-orphan")


class Vote(Base):
    __tablename__ = "votes"
    __table_args__ = (UniqueConstraint("election_id", "user_id", name="one_vote_per_election"),)

    id = Column(Integer, primary_key=True, index=True)
    election_id = Column(Integer, ForeignKey("elections.id"), nullable=False)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    voted_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="votes")
    candidate = relationship("Candidate", back_populates="votes")


class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class SecurityEvent(Base):
    """Audit + security log. Created automatically by Base.metadata.create_all."""
    __tablename__ = "security_events"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String, index=True, nullable=False)
    severity = Column(String, index=True, default="warning")  # info | warning | critical
    ip = Column(String, index=True)
    user_agent = Column(String)
    path = Column(String)
    method = Column(String)
    email = Column(String, index=True)
    user_id = Column(Integer)
    detail = Column(Text)
    created_at = Column(DateTime(timezone=True), index=True, default=lambda: datetime.now(timezone.utc))