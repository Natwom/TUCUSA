import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

db_url = settings.DATABASE_URL

if db_url.startswith(("postgresql://", "postgres://")):
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+psycopg://", 1)
    else:
        db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)

    connect_args = {}
    if "sslmode=" not in db_url:
        connect_args["sslmode"] = "require"

    engine_kwargs = {"pool_pre_ping": True}
    if connect_args:
        engine_kwargs["connect_args"] = connect_args

    engine = create_engine(db_url, **engine_kwargs)

elif db_url.startswith("sqlite"):
    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False}
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