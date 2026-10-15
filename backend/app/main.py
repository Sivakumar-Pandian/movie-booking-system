import os
import uuid
from typing import List, Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import engine, Base, get_db, SessionLocal
from app.db_models import User, Movie, Theater, Showtime, Booking, BookedSeat
from app.models import (
    HealthResponse,
    MovieResponse,
    UserRegister,
    UserLogin,
    UserResponse,
    TokenResponse,
    ShowtimeSeatsResponse,
    BookingCreateRequest,
    BookingResponse,
)
from app.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)
from app.seed import seed_database_if_empty


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables
    Base.metadata.create_all(bind=engine)
    # Seed initial data
    db = SessionLocal()
    try:
        seed_database_if_empty(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Yozigo Cinema Ticket Booking API",
    description="Backend API services with PostgreSQL/SQLite support, JWT Auth, and Concurrency-Safe Bookings",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# ==========================================
# 1. Health & Movies Endpoints
# ==========================================
@app.get(
    "/api/health",
    response_model=HealthResponse,
    tags=["Health"],
    summary="Health check endpoint",
)
def get_health() -> HealthResponse:
    """Return operational health status of the backend API."""
    return HealthResponse(
        status="ok",
        app="Yozigo Cinema Backend",
        version="1.0.0",
    )


@app.get(
    "/api/movies",
    response_model=List[MovieResponse],
    tags=["Movies"],
    summary="Fetch all movies currently showing",
)
def get_movies(db: Session = Depends(get_db)) -> List[MovieResponse]:
    """Return list of currently showing movies from database."""
    movies = db.query(Movie).all()
    result = []
    for m in movies:
        result.append(
            MovieResponse(
                id=m.id,
                title=m.title,
                genre=m.genre,
                duration=m.duration,
                rating=m.rating,
                votes=m.votes,
                certification=m.certification,
                formats=m.formats,
                releaseYear=m.release_year,
                language=m.language,
                synopsis=m.synopsis,
                posterUrl=m.poster_url,
                backdropUrl=m.backdrop_url,
                isFeatured=m.is_featured,
                director=m.director,
                cast=m.cast,
                trailerYoutubeId=m.trailer_youtube_id,
            )
        )
    return result


@app.get(
    "/api/movies/{movie_id}",
    response_model=MovieResponse,
    tags=["Movies"],
    summary="Fetch movie details by ID",
)
def get_movie_detail(movie_id: str, db: Session = Depends(get_db)) -> MovieResponse:
    """Return single movie detail by ID."""
    m = db.query(Movie).filter(Movie.id == movie_id).first()
    if not m:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Movie with ID '{movie_id}' not found",
        )
    return MovieResponse(
        id=m.id,
        title=m.title,
        genre=m.genre,
        duration=m.duration,
        rating=m.rating,
        votes=m.votes,
        certification=m.certification,
        formats=m.formats,
        releaseYear=m.release_year,
        language=m.language,
        synopsis=m.synopsis,
        posterUrl=m.poster_url,
        backdropUrl=m.backdrop_url,
        isFeatured=m.is_featured,
        director=m.director,
        cast=m.cast,
        trailerYoutubeId=m.trailer_youtube_id,
    )


# ==========================================
# 2. Authentication Endpoints
# ==========================================
@app.post(
    "/api/auth/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Authentication"],
    summary="Register a new user account",
)
def register_user(req: UserRegister, db: Session = Depends(get_db)) -> TokenResponse:
    """Register a new user with bcrypt password hashing and return JWT token."""
    existing_user = db.query(User).filter(User.email == req.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please log in.",
        )

    hashed_pw = hash_password(req.password)
    user = User(
        email=req.email.lower(),
        hashed_password=hashed_pw,
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


@app.post(
    "/api/auth/login",
    response_model=TokenResponse,
    tags=["Authentication"],
    summary="Log in an existing user",
)
def login_user(req: UserLogin, db: Session = Depends(get_db)) -> TokenResponse:
    """Authenticate email and password and return signed JWT token."""
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


@app.get(
    "/api/auth/me",
    response_model=UserResponse,
    tags=["Authentication"],
    summary="Get current logged in user profile",
)
def get_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    """Return profile information of the currently authenticated user."""
    return UserResponse.model_validate(current_user)


# ==========================================
# 3. Seats & Showtimes Availability
# ==========================================
@app.get(
    "/api/showtimes/{showtime_id}/seats",
    response_model=ShowtimeSeatsResponse,
    tags=["Showtimes"],
    summary="Get all booked seats for a showtime",
)
def get_showtime_booked_seats(
    showtime_id: str,
    db: Session = Depends(get_db),
) -> ShowtimeSeatsResponse:
    """Return list of confirmed booked seat numbers for the given showtime."""
    booked_rows = (
        db.query(BookedSeat.seat_number)
        .filter(
            BookedSeat.showtime_id == showtime_id,
            BookedSeat.status == "CONFIRMED",
        )
        .all()
    )
    seat_numbers = [row[0] for row in booked_rows]
    return ShowtimeSeatsResponse(showtime_id=showtime_id, booked_seats=seat_numbers)


# ==========================================
# 4. Booking Endpoints (Double Booking Safe)
# ==========================================
@app.post(
    "/api/bookings",
    response_model=BookingResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Bookings"],
    summary="Create a new ticket booking with atomic double-booking prevention",
)
def create_booking(
    req: BookingCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BookingResponse:
    """
    Atomically create a ticket booking.
    Guarantees concurrency safety via:
      1. Explicit transaction check of requested seats.
      2. Database-level UNIQUE constraint on (showtime_id, seat_number).
      3. Automatic rollback and HTTP 409 Conflict if seats are already taken.
    """
    clean_seats = sorted(list(set(s.strip().upper() for s in req.seats)))
    if not clean_seats:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one seat must be selected to complete a booking.",
        )

    # 1. Pre-check within session
    already_booked = (
        db.query(BookedSeat.seat_number)
        .filter(
            BookedSeat.showtime_id == req.showtime_id,
            BookedSeat.seat_number.in_(clean_seats),
            BookedSeat.status == "CONFIRMED",
        )
        .all()
    )
    if already_booked:
        taken_seats = [row[0] for row in already_booked]
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Seats {', '.join(taken_seats)} have already been booked by another user. Please choose different seats.",
        )

    # Lookup showtime/theater/movie fallback if not passed directly in snapshot
    st_record = db.query(Showtime).filter(Showtime.id == req.showtime_id).first()
    movie_title = req.movie_title or (st_record.movie.title if st_record and st_record.movie else "Cinema Premiere")
    theater_name = req.theater_name or (st_record.theater.name if st_record and st_record.theater else "PVR INOX")
    theater_loc = req.theater_location or (st_record.theater.location if st_record and st_record.theater else "Main Multiplex")
    show_date = req.show_date or (st_record.show_date if st_record else "Today")
    show_time = req.show_time or (st_record.time if st_record else "10:30 AM")
    format_name = req.format or (st_record.format if st_record else "IMAX 3D")

    # Generate unique booking reference
    booking_ref = f"YZG-{uuid.uuid4().hex[:8].upper()}"

    # 2. Insert Booking and BookedSeats inside transaction
    try:
        new_booking = Booking(
            booking_ref=booking_ref,
            user_id=current_user.id,
            showtime_id=req.showtime_id,
            seat_count=len(clean_seats),
            price_per_seat=req.price_per_seat,
            subtotal=req.subtotal,
            convenience_fee=req.convenience_fee,
            total_amount=req.total_amount,
            payment_method=req.payment_method,
            payment_status="COMPLETED",
            movie_title=movie_title,
            theater_name=theater_name,
            theater_location=theater_loc,
            show_date=show_date,
            show_time=show_time,
            format=format_name,
        )
        db.add(new_booking)
        db.flush() # Populate new_booking.id

        for seat_num in clean_seats:
            booked_seat = BookedSeat(
                booking_id=new_booking.id,
                showtime_id=req.showtime_id,
                seat_number=seat_num,
                status="CONFIRMED",
            )
            db.add(booked_seat)

        db.commit()
        db.refresh(new_booking)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Conflict detected: One or more of your chosen seats were booked in a concurrent transaction. Please select alternative seats.",
        )

    return BookingResponse(
        id=new_booking.id,
        booking_ref=new_booking.booking_ref,
        showtime_id=new_booking.showtime_id,
        movie_title=new_booking.movie_title or "Cinema Premiere",
        theater_name=new_booking.theater_name or "Cinema Theater",
        theater_location=new_booking.theater_location,
        show_date=new_booking.show_date or "Today",
        show_time=new_booking.show_time or "10:30 AM",
        format=new_booking.format or "2D",
        seats=clean_seats,
        seat_count=new_booking.seat_count,
        price_per_seat=new_booking.price_per_seat,
        subtotal=new_booking.subtotal,
        convenience_fee=new_booking.convenience_fee,
        total_amount=new_booking.total_amount,
        payment_method=new_booking.payment_method,
        payment_status=new_booking.payment_status,
        created_at=new_booking.created_at,
    )


@app.get(
    "/api/bookings",
    response_model=List[BookingResponse],
    tags=["Bookings"],
    summary="List all bookings for the authenticated user",
)
def get_user_bookings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[BookingResponse]:
    """Retrieve all tickets booked by the currently logged-in user."""
    user_bookings = (
        db.query(Booking)
        .filter(Booking.user_id == current_user.id)
        .order_by(Booking.created_at.desc())
        .all()
    )

    results = []
    for b in user_bookings:
        seat_nums = [s.seat_number for s in b.seats]
        results.append(
            BookingResponse(
                id=b.id,
                booking_ref=b.booking_ref,
                showtime_id=b.showtime_id,
                movie_title=b.movie_title or "Cinema Movie",
                theater_name=b.theater_name or "Cinema Theater",
                theater_location=b.theater_location,
                show_date=b.show_date or "Today",
                show_time=b.show_time or "10:30 AM",
                format=b.format or "2D",
                seats=seat_nums,
                seat_count=b.seat_count,
                price_per_seat=b.price_per_seat,
                subtotal=b.subtotal,
                convenience_fee=b.convenience_fee,
                total_amount=b.total_amount,
                payment_method=b.payment_method,
                payment_status=b.payment_status,
                created_at=b.created_at,
            )
        )
    return results
