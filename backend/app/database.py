import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Database URL configuration (Defaults to local SQLite for frictionless local dev, or PostgreSQL when set)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./yozigo.db")

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency yielding a database session with automatic cleanup."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
