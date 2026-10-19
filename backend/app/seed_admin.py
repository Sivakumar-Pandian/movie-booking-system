import os

from pydantic import EmailStr, TypeAdapter, ValidationError
from sqlalchemy.orm import Session

from app.auth import hash_password
from app.database import Base, SessionLocal, engine
from app.db_models import User


def seed_admin_account(db: Session, email: str, password: str, full_name: str) -> User:
    normalized_email = str(TypeAdapter(EmailStr).validate_python(email)).lower()
    if len(password) < 8:
        raise ValueError("ADMIN_PASSWORD must be at least 8 characters.")

    user = db.query(User).filter(User.email == normalized_email).first()
    if user is None:
        user = User(email=normalized_email, full_name=full_name.strip(), hashed_password=hash_password(password))
        db.add(user)
    else:
        user.full_name = full_name.strip()
        user.hashed_password = hash_password(password)
    user.role = "ADMIN"
    db.commit()
    db.refresh(user)
    return user


def main() -> None:
    email = os.getenv("ADMIN_EMAIL")
    password = os.getenv("ADMIN_PASSWORD")
    full_name = os.getenv("ADMIN_FULL_NAME", "Yozigo Admin")
    if not email or not password:
        raise SystemExit("Set ADMIN_EMAIL and ADMIN_PASSWORD before running the admin seed command.")
    if not full_name.strip():
        raise SystemExit("ADMIN_FULL_NAME must not be empty.")

    try:
        Base.metadata.create_all(bind=engine)
        with SessionLocal() as db:
            admin = seed_admin_account(db, email, password, full_name)
    except (ValueError, ValidationError) as error:
        raise SystemExit(f"Could not seed admin account: {error}") from error
    print(f"Admin account seeded for {admin.email}.")


if __name__ == "__main__":
    main()
