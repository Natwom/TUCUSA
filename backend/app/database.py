import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

db_url = settings.DATABASE_URL

if db_url.startswith("sqlite"):
    engine = create_engine(
        db_url, 
        connect_args={"check_same_thread": False}
    )
elif db_url.startswith("postgresql"):
    # SQLAlchemy 2.0 + psycopg v3 needs the +psycopg driver prefix
    db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)
    # Render PostgreSQL requires SSL
    engine = create_engine(
        db_url, 
        pool_pre_ping=True,
        connect_args={"sslmode": "require"}
    )
else:
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "tucusa.db")
    engine = create_engine(
        f"sqlite:///{db_path}", 
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()