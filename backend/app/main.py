from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database import engine, Base
from app.routers import auth, students, elections, candidates, votes, announcements, admin

Base.metadata.create_all(bind=engine)

app = FastAPI(title="TUCUSA VOTE API", version="1.0.0")

# Serve uploaded images
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
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