from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from app.database import engine, Base
from app.routers import auth, students, elections, candidates, votes, announcements, admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="TUCUSA VOTE API",
    version="1.0.0",
    lifespan=lifespan
)

origins = ["http://localhost:5173", "http://localhost:5174"]

frontend_url = os.getenv("FRONTEND_URL")
admin_url = os.getenv("ADMIN_URL")
if frontend_url:
    origins.append(frontend_url)
if admin_url:
    origins.append(admin_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(students.router)
app.include_router(elections.router)
app.include_router(candidates.router)
app.include_router(votes.router)
app.include_router(announcements.router)
app.include_router(admin.router)


@app.get("/")
def root():
    return {"message": "TUCUSA VOTE API is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}