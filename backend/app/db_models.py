import json
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="CUSTOMER")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    bookings = relationship("Booking", back_populates="user")


class Movie(Base):
    __tablename__ = "movies"

    id = Column(String(50), primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    genre_json = Column(Text, nullable=False, default="[]")
    duration = Column(String(50), nullable=False)
    rating = Column(Float, nullable=False)
    votes = Column(String(50), nullable=False)
    certification = Column(String(50), nullable=False)
    formats_json = Column(Text, nullable=False, default="[]")
    release_year = Column(Integer, nullable=False)
    language = Column(String(50), nullable=False)
    synopsis = Column(Text, nullable=False)
    poster_url = Column(String(500), nullable=False)
    backdrop_url = Column(String(500), nullable=True)
    is_featured = Column(Boolean, default=False)
    director = Column(String(255), nullable=True)
    cast_json = Column(Text, nullable=True, default="[]")
    trailer_youtube_id = Column(String(100), nullable=True)

    showtimes = relationship("Showtime", back_populates="movie")

    @property
    def genre(self):
        return json.loads(self.genre_json) if self.genre_json else []

    @genre.setter
    def genre(self, value):
        self.genre_json = json.dumps(value)

    @property
    def formats(self):
        return json.loads(self.formats_json) if self.formats_json else []

    @formats.setter
    def formats(self, value):
        self.formats_json = json.dumps(value)

    @property
    def cast(self):
        return json.loads(self.cast_json) if self.cast_json else []

    @cast.setter
    def cast(self, value):
        self.cast_json = json.dumps(value)


class Theater(Base):
    __tablename__ = "theaters"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    location = Column(String(255), nullable=False)
    distance = Column(String(100), nullable=False)

    showtimes = relationship("Showtime", back_populates="theater")


class Showtime(Base):
    __tablename__ = "showtimes"
    __table_args__ = (
        Index("ix_showtimes_movie_date", "movie_id", "show_date"),
    )

    id = Column(String(80), primary_key=True, index=True)
    movie_id = Column(String(50), ForeignKey("movies.id"), nullable=False, index=True)
    theater_id = Column(String(50), ForeignKey("theaters.id"), nullable=False, index=True)
    show_date = Column(String(50), nullable=False)  # e.g. "d1"
    time = Column(String(50), nullable=False)
    format = Column(String(50), nullable=False)
    price = Column(Integer, nullable=False)

    movie = relationship("Movie", back_populates="showtimes")
    theater = relationship("Theater", back_populates="showtimes")
    bookings = relationship("Booking", back_populates="showtime")
    booked_seats = relationship("BookedSeat", back_populates="showtime")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    booking_ref = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    showtime_id = Column(String(80), ForeignKey("showtimes.id"), nullable=False, index=True)
    seat_count = Column(Integer, nullable=False)
    price_per_seat = Column(Integer, nullable=False)
    subtotal = Column(Integer, nullable=False)
    convenience_fee = Column(Integer, nullable=False)
    total_amount = Column(Integer, nullable=False)
    payment_method = Column(String(50), nullable=False)
    payment_status = Column(String(50), default="CONFIRMED", nullable=False)
    movie_title = Column(String(255), nullable=True)
    theater_name = Column(String(255), nullable=True)
    theater_location = Column(String(255), nullable=True)
    show_date = Column(String(50), nullable=True)
    show_time = Column(String(50), nullable=True)
    format = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="bookings")
    showtime = relationship("Showtime", back_populates="bookings")
    seats = relationship("BookedSeat", back_populates="booking", cascade="all, delete-orphan")


class BookedSeat(Base):
    __tablename__ = "booked_seats"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)
    showtime_id = Column(String(80), ForeignKey("showtimes.id"), nullable=False, index=True)
    seat_number = Column(String(10), nullable=False) # e.g. "A1", "C5"
    status = Column(String(50), default="CONFIRMED", nullable=False)

    # Core requirement: Unique constraint guarantees atomic prevention of double bookings!
    __table_args__ = (
        UniqueConstraint("showtime_id", "seat_number", name="uq_showtime_seat"),
    )

    booking = relationship("Booking", back_populates="seats")
    showtime = relationship("Showtime", back_populates="booked_seats")


class SeatHold(Base):
    """A temporary, user-owned reservation that expires unless payment succeeds."""
    __tablename__ = "seat_holds"
    __table_args__ = (
        UniqueConstraint("showtime_id", "seat_number", name="uq_showtime_held_seat"),
        Index("ix_seat_holds_expiry", "expires_at"),
    )

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    showtime_id = Column(String(80), ForeignKey("showtimes.id"), nullable=False, index=True)
    seat_number = Column(String(10), nullable=False)
    expires_at = Column(DateTime, nullable=False)
