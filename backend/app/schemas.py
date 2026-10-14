from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import datetime, timezone
from typing import Optional, List, Literal

PHONE_PATTERN = r"^\+?[0-9][0-9\s\-]{7,17}$"


def _ensure_utc(v):
    """Helper: naive datetimes from SQLite are treated as UTC."""
    if isinstance(v, datetime) and v.tzinfo is None:
        return v.replace(tzinfo=timezone.utc)
    return v


# --- Auth ---
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[str] = None


# --- User / Student ---
class UserRegister(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    admission_number: str = Field(min_length=3, max_length=50)
    course: str = Field(min_length=2, max_length=100)
    year_of_study: int = Field(ge=1, le=8)
    constituency: str = Field(min_length=1, max_length=100)
    email: EmailStr
    phone: str = Field(pattern=PHONE_PATTERN)
    password: str = Field(min_length=8, max_length=72)


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    admission_number: str
    course: str
    year_of_study: int
    constituency: str
    phone: str
    national_id_photo: Optional[str] = None
    student_id_photo: Optional[str] = None
    profile_picture: Optional[str] = None
    role: str
    is_active: bool
    is_approved: bool
    unique_voter_id: Optional[str] = None
    created_at: datetime

    @field_validator('created_at', mode='before')
    @classmethod
    def normalize_created_at(cls, v):
        return _ensure_utc(v)

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    course: Optional[str] = Field(None, min_length=2, max_length=100)
    year_of_study: Optional[int] = Field(None, ge=1, le=8)
    constituency: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, pattern=PHONE_PATTERN)
    profile_picture: Optional[str] = Field(None, max_length=500)

    @field_validator('profile_picture')
    @classmethod
    def https_only(cls, v):
        if v and not v.lower().startswith("https://"):
            raise ValueError("Profile picture must be an https URL")
        return v


class VoterCardOut(BaseModel):
    full_name: str
    admission_number: str
    unique_voter_id: str
    course: str
    year_of_study: int
    constituency: str
    national_id_photo: Optional[str] = None
    student_id_photo: Optional[str] = None
    profile_picture: Optional[str] = None


# --- Election ---
class ElectionCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    position: str = Field(min_length=1, max_length=100)
    description: str = Field("", max_length=5000)
    start_time: datetime
    end_time: datetime


class ElectionUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    position: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=5000)
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[Literal["upcoming", "active", "closed"]] = None


class ElectionOut(BaseModel):
    id: int
    title: str
    position: str
    description: str
    start_time: datetime
    end_time: datetime
    status: str
    created_at: datetime

    @field_validator('start_time', 'end_time', 'created_at', mode='before')
    @classmethod
    def normalize_election_datetimes(cls, v):
        return _ensure_utc(v)

    class Config:
        from_attributes = True


# --- Candidate ---
class CandidateCreate(BaseModel):
    election_id: int
    name: str = Field(min_length=1, max_length=150)
    photo_url: Optional[str] = None
    manifesto: str = Field("", max_length=5000)


class CandidateOut(BaseModel):
    id: int
    election_id: int
    name: str
    photo_url: Optional[str] = None
    manifesto: str
    votes_count: int

    class Config:
        from_attributes = True


# --- Vote ---
class VoteCreate(BaseModel):
    election_id: int
    candidate_id: int


class VoteOut(BaseModel):
    id: int
    election_id: int
    candidate_id: int
    voted_at: datetime

    @field_validator('voted_at', mode='before')
    @classmethod
    def normalize_voted_at(cls, v):
        return _ensure_utc(v)

    class Config:
        from_attributes = True


# --- Result ---
class CandidateResult(BaseModel):
    candidate_id: int
    name: str
    photo_url: Optional[str] = None
    votes_count: int
    percentage: float


class ElectionResult(BaseModel):
    election_id: int
    title: str
    total_votes: int
    candidates: List[CandidateResult]


# --- Announcement ---
class AnnouncementCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1, max_length=5000)


class AnnouncementOut(BaseModel):
    id: int
    title: str
    content: str
    created_at: datetime

    @field_validator('created_at', mode='before')
    @classmethod
    def normalize_announcement_datetime(cls, v):
        return _ensure_utc(v)

    class Config:
        from_attributes = True


# --- Admin Stats ---
class AdminStats(BaseModel):
    total_students: int
    total_votes_cast: int
    active_elections: int
    pending_approvals: int


# --- Security events ---
class SecurityEventOut(BaseModel):
    id: int
    event_type: str
    severity: str
    ip: Optional[str] = None
    user_agent: Optional[str] = None
    path: Optional[str] = None
    method: Optional[str] = None
    email: Optional[str] = None
    user_id: Optional[int] = None
    detail: Optional[str] = None
    created_at: datetime

    @field_validator('created_at', mode='before')
    @classmethod
    def normalize_event_datetime(cls, v):
        return _ensure_utc(v)

    class Config:
        from_attributes = True