from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.db_models import BookedSeat, Booking, User
from app.models import BookingCreateRequest, BookingResponse, ShowtimeSeatsResponse
from app.services import booking_to_response, create_booking

router = APIRouter()


@router.get(
    "/api/showtimes/{showtime_id}/seats",
    response_model=ShowtimeSeatsResponse,
    tags=["Showtimes"],
    summary="Get all booked seats for a showtime",
)
def get_showtime_booked_seats(
    showtime_id: str,
    db: Session = Depends(get_db),
) -> ShowtimeSeatsResponse:
    booked_rows = (
        db.query(BookedSeat.seat_number)
        .filter(
            BookedSeat.showtime_id == showtime_id,
            BookedSeat.status == "CONFIRMED",
        )
        .all()
    )
    return ShowtimeSeatsResponse(
        showtime_id=showtime_id,
        booked_seats=[row[0] for row in booked_rows],
    )


@router.post(
    "/api/bookings",
    response_model=BookingResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Bookings"],
    summary="Create a ticket booking with atomic double-booking prevention",
)
def post_booking(
    req: BookingCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BookingResponse:
    return create_booking(db, current_user, req)


@router.get(
    "/api/bookings",
    response_model=List[BookingResponse],
    tags=["Bookings"],
    summary="List all bookings for the authenticated user",
)
def get_user_bookings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[BookingResponse]:
    user_bookings = (
        db.query(Booking)
        .filter(Booking.user_id == current_user.id)
        .order_by(Booking.created_at.desc())
        .all()
    )
    return [booking_to_response(booking) for booking in user_bookings]
