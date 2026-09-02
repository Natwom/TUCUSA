from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List


# --- Auth ---
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[str] = None


# --- User / Student ---
class UserRegister(BaseModel):
    full_name: str
    admission_number: str
    course: str
    year_of_study: int
    constituency: str
    email: EmailStr
    phone: str
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    admission_number: str
    course: str
    year_of_study: int
    constituency: str
    phone: str
    national_id_photo: Optional[str] = None      # <-- ADDED
    student_id_photo: Optional[str] = None       # <-- ADDED
    profile_picture: Optional[str] = None
    role: str
    is_active: bool
    is_approved: bool
    unique_voter_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    course: Optional[str] = None
    year_of_study: Optional[int] = None
    constituency: Optional[str] = None
    phone: Optional[str] = None
    profile_picture: Optional[str] = None


class VoterCardOut(BaseModel):
    full_name: str
    admission_number: str
    unique_voter_id: str
    course: str
    year_of_study: int
    constituency: str
    national_id_photo: Optional[str] = None      # <-- ADDED
    student_id_photo: Optional[str] = None       # <-- ADDED
    profile_picture: Optional[str] = None


# --- Election ---
class ElectionCreate(BaseModel):
    title: str
    position: str
    description: str = ""
    start_time: datetime
    end_time: datetime


class ElectionUpdate(BaseModel):
    title: Optional[str] = None
    position: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[str] = None


class ElectionOut(BaseModel):
    id: int
    title: str
    position: str
    description: str
    start_time: datetime
    end_time: datetime
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- Candidate ---
class CandidateCreate(BaseModel):
    election_id: int
    name: str
    photo_url: Optional[str] = None
    manifesto: str = ""


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
    title: str
    content: str


class AnnouncementOut(BaseModel):
    id: int
    title: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- Admin Stats ---
class AdminStats(BaseModel):
    total_students: int
    total_votes_cast: int
    active_elections: int
    pending_approvals: int