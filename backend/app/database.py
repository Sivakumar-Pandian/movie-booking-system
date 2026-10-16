import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

# Database URL configuration (Defaults to local SQLite for frictionless local dev, or PostgreSQL when set)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./yozigo.db")

# Neon/Render often supply postgresql://; SQLAlchemy 2.1+ defaults that to psycopg3.
# This app depends on psycopg2-binary, so pin the driver explicitly.
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

connect_args = {}
engine_kwargs = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
else:
    # Neon computes can scale to zero; drop stale connections after resume.
    engine_kwargs["pool_pre_ping"] = True

engine = create_engine(DATABASE_URL, connect_args=connect_args, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency yielding a database session with automatic cleanup."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
