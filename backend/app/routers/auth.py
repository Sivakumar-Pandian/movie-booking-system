from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import create_access_token, get_current_user, hash_password, verify_password
from app.database import get_db
from app.db_models import User
from app.models import TokenResponse, UserLogin, UserRegister, UserResponse

router = APIRouter(tags=["Authentication"])


@router.post(
    "/api/auth/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
)
def register_user(req: UserRegister, db: Session = Depends(get_db)) -> TokenResponse:
    existing_user = db.query(User).filter(User.email == req.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please log in.",
        )

    user = User(
        email=req.email.lower(),
        hashed_password=hash_password(req.password),
        full_name=req.full_name.strip(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(data={"sub": str(user.id), "email": user.email})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post("/api/auth/login", response_model=TokenResponse, summary="Log in an existing user")
def login_user(req: UserLogin, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(data={"sub": str(user.id), "email": user.email})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get("/api/auth/me", response_model=UserResponse, summary="Get current logged in user profile")
def get_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse.model_validate(current_user)
