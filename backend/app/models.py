from typing import List, Literal, Optional
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr, ConfigDict


class HealthResponse(BaseModel):
    """Health check response schema."""
    status: str = Field(default="ok", description="Server operational status")
    app: str = Field(default="Yozigo Cinema Backend", description="API application title")
    version: str = Field(default="1.0.0", description="API version")


class MovieResponse(BaseModel):
    """Pydantic model representing movie details returned to frontend."""
    id: str = Field(..., description="Unique movie identifier, e.g. 'm1'")
    title: str = Field(..., description="Full movie title")
    genre: List[str] = Field(..., description="List of genres")
    duration: str = Field(..., description="Formatted runtime, e.g. '2h 49m'")
    rating: float = Field(..., description="Critic/Audience rating score out of 10")
    votes: str = Field(..., description="Total votes count formatted, e.g. '248.6K'")
    certification: str = Field(..., description="Cinema film certification, e.g. 'UA 13+'")
    formats: List[str] = Field(..., description="Screen formats, e.g. ['IMAX 3D', '4DX']")
    releaseYear: int = Field(..., description="Release year")
    language: str = Field(..., description="Primary audio language")
    synopsis: str = Field(..., description="Story summary and description")
    posterUrl: str = Field(..., description="High-resolution poster image URL")
    backdropUrl: Optional[str] = Field(default=None, description="Cinematic widescreen banner URL")
    isFeatured: Optional[bool] = Field(default=False, description="Flag for hero marquee premiere")
    director: Optional[str] = Field(default=None, description="Film director name")
    cast: Optional[List[str]] = Field(default=None, description="Starring cast list")
    trailerYoutubeId: Optional[str] = Field(default=None, description="YouTube trailer teaser ID")


# --- Auth Models ---
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password at least 8 characters")
    full_name: str = Field(..., min_length=2, description="User full display name")


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str
    role: str
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# --- Seat & Showtime Models ---
class ShowtimeSlotResponse(BaseModel):
    id: str
    time: str
    format: str
    status: Literal["Available", "Filling Fast", "Almost Full"]
    price: int
    available_seats: int = 80


class TheaterShowtimesResponse(BaseModel):
    id: str
    name: str
    location: str
    distance: str
    showtimes: List[ShowtimeSlotResponse]


class ShowtimeSeatsResponse(BaseModel):
    showtime_id: str
    booked_seats: List[str]
    held_seats: List[str] = []


class HoldCreateRequest(BaseModel):
    showtime_id: str
    seats: List[str] = Field(..., min_length=1, max_length=6)


class HoldResponse(BaseModel):
    showtime_id: str
    seats: List[str]
    expires_at: datetime


# --- Booking Models ---
class BookingCreateRequest(BaseModel):
    showtime_id: str
    movie_id: Optional[str] = None
    movie_title: Optional[str] = None
    theater_name: Optional[str] = None
    theater_location: Optional[str] = None
    show_date: Optional[str] = None
    show_time: Optional[str] = None
    format: Optional[str] = None
    seats: List[str] = Field(..., min_length=1, description="List of seat identifiers, e.g. ['A1', 'A2']")
    payment_method: str = Field(default="upi", description="Payment method: upi, card, or netbanking")
    # Client amounts are ignored; the API prices from the showtime row.
    price_per_seat: Optional[int] = Field(default=None, gt=0)
    subtotal: Optional[int] = Field(default=None, gt=0)
    convenience_fee: Optional[int] = Field(default=None, ge=0)
    total_amount: Optional[int] = Field(default=None, gt=0)


class PaymentRequest(BaseModel):
    showtime_id: str
    seats: List[str] = Field(..., min_length=1, max_length=6)
    payment_method: str = "upi"
    success: bool = True


class CancelBookingResponse(BaseModel):
    booking_ref: str
    payment_status: str
    detail: str


class MovieUpsert(BaseModel):
    id: str = Field(..., min_length=1, max_length=50)
    title: str = Field(..., min_length=1)
    duration: str = Field(..., description="Runtime such as '2h 30m'")
    language: str
    certification: str
    poster_url: str
    synopsis: str = ""
    rating: float = 0
    votes: str = "0"
    genre: List[str] = []
    formats: List[str] = []
    release_year: int = 2026


class ShowtimeCreate(BaseModel):
    id: str = Field(..., min_length=1, max_length=80)
    movie_id: str
    theater_id: str
    show_date: str = Field(..., description="ISO date: YYYY-MM-DD")
    time: str = Field(..., description="12-hour time, e.g. 07:30 PM")
    format: str = "2D"
    price: int = Field(..., gt=0)


class AdminShowReport(BaseModel):
    showtime_id: str
    movie_title: str
    show_date: str
    time: str
    booked_seats: int
    capacity: int = 80
    occupancy_percent: float
    total_collected: int


class BookingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    booking_ref: str
    showtime_id: str
    movie_id: Optional[str] = None
    movie_title: str
    theater_name: str
    theater_location: Optional[str] = None
    show_date: str
    show_time: str
    format: str
    seats: List[str]
    seat_count: int
    price_per_seat: int
    subtotal: int
    convenience_fee: int
    total_amount: int
    payment_method: str
    payment_status: str
    created_at: datetime
