from typing import List
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.db_models import BookedSeat, Booking, SeatHold, User
from app.models import BookingCreateRequest, BookingResponse, CancelBookingResponse, HoldCreateRequest, HoldResponse, PaymentRequest, ShowtimeSeatsResponse
from app.services import booking_to_response, confirm_payment, create_booking, create_hold, clear_expired_holds

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
    clear_expired_holds(db)
    db.commit()
    booked_rows = (
        db.query(BookedSeat.seat_number)
        .filter(
            BookedSeat.showtime_id == showtime_id,
            BookedSeat.status == "CONFIRMED",
        )
        .all()
    )
    held_rows = db.query(SeatHold.seat_number).filter(SeatHold.showtime_id == showtime_id).all()
    return ShowtimeSeatsResponse(
        showtime_id=showtime_id,
        booked_seats=[row[0] for row in booked_rows],
        held_seats=[row[0] for row in held_rows],
    )


@router.post("/api/holds", response_model=HoldResponse, status_code=status.HTTP_201_CREATED, tags=["Bookings"])
def post_hold(req: HoldCreateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> HoldResponse:
    return create_hold(db, current_user, req)


@router.post("/api/payments", response_model=BookingResponse, tags=["Bookings"])
def post_payment(req: PaymentRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> BookingResponse:
    return confirm_payment(db, current_user, req)


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
        .all()
    )
    def sort_key(booking: Booking):
        try:
            starts = datetime.strptime(f"{booking.show_date} {booking.show_time}", "%Y-%m-%d %I:%M %p")
            return (0 if starts >= datetime.now() else 1, starts)
        except (TypeError, ValueError):
            return (1, booking.created_at)
    user_bookings.sort(key=sort_key)
    return [booking_to_response(booking) for booking in user_bookings]


@router.post("/api/bookings/{booking_ref}/cancel", response_model=CancelBookingResponse, tags=["Bookings"])
def cancel_booking(booking_ref: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> CancelBookingResponse:
    booking = db.query(Booking).filter(Booking.booking_ref == booking_ref, Booking.user_id == current_user.id).first()
    if not booking:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Booking not found.")
    if booking.payment_status == "CANCELLED":
        from fastapi import HTTPException
        raise HTTPException(status_code=409, detail="This booking is already cancelled.")
    try:
        show_time = datetime.strptime(f"{booking.show_date} {booking.show_time}", "%Y-%m-%d %I:%M %p")
    except (TypeError, ValueError):
        from fastapi import HTTPException
        raise HTTPException(status_code=409, detail="This legacy booking cannot be cancelled online.")
    if show_time <= datetime.now() + timedelta(hours=2):
        from fastapi import HTTPException
        raise HTTPException(status_code=409, detail="Bookings can only be cancelled more than two hours before the show.")
    db.query(BookedSeat).filter(BookedSeat.booking_id == booking.id).delete(synchronize_session=False)
    booking.payment_status = "CANCELLED"
    db.commit()
    return CancelBookingResponse(booking_ref=booking_ref, payment_status="CANCELLED", detail="Booking cancelled and seats released.")
