import uuid
from typing import List

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.db_models import BookedSeat, Booking, Showtime, User
from app.models import BookingCreateRequest, BookingResponse

CONVENIENCE_FEE_PER_SEAT = 28


def booking_to_response(booking: Booking, seats: List[str] | None = None) -> BookingResponse:
    seat_nums = seats if seats is not None else [s.seat_number for s in booking.seats]
    return BookingResponse(
        id=booking.id,
        booking_ref=booking.booking_ref,
        showtime_id=booking.showtime_id,
        movie_title=booking.movie_title or "Cinema Movie",
        theater_name=booking.theater_name or "Cinema Theater",
        theater_location=booking.theater_location,
        show_date=booking.show_date or "Today",
        show_time=booking.show_time or "10:30 AM",
        format=booking.format or "2D",
        seats=seat_nums,
        seat_count=booking.seat_count,
        price_per_seat=booking.price_per_seat,
        subtotal=booking.subtotal,
        convenience_fee=booking.convenience_fee,
        total_amount=booking.total_amount,
        payment_method=booking.payment_method,
        payment_status=booking.payment_status,
        created_at=booking.created_at,
    )


def create_booking(
    db: Session,
    current_user: User,
    req: BookingCreateRequest,
) -> BookingResponse:
    clean_seats = sorted({s.strip().upper() for s in req.seats if s.strip()})
    if not clean_seats:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one seat must be selected to complete a booking.",
        )

    showtime = (
        db.query(Showtime)
        .options(joinedload(Showtime.movie), joinedload(Showtime.theater))
        .filter(Showtime.id == req.showtime_id)
        .first()
    )
    if not showtime:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Showtime '{req.showtime_id}' was not found.",
        )

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
            detail=(
                f"Seats {', '.join(taken_seats)} have already been booked by another user. "
                "Please choose different seats."
            ),
        )

    seat_count = len(clean_seats)
    price_per_seat = showtime.price
    subtotal = price_per_seat * seat_count
    convenience_fee = CONVENIENCE_FEE_PER_SEAT * seat_count
    total_amount = subtotal + convenience_fee

    booking_ref = f"YZG-{uuid.uuid4().hex[:8].upper()}"
    try:
        new_booking = Booking(
            booking_ref=booking_ref,
            user_id=current_user.id,
            showtime_id=showtime.id,
            seat_count=seat_count,
            price_per_seat=price_per_seat,
            subtotal=subtotal,
            convenience_fee=convenience_fee,
            total_amount=total_amount,
            payment_method=req.payment_method,
            payment_status="COMPLETED",
            movie_title=showtime.movie.title if showtime.movie else req.movie_title,
            theater_name=showtime.theater.name if showtime.theater else req.theater_name,
            theater_location=showtime.theater.location if showtime.theater else req.theater_location,
            show_date=showtime.show_date,
            show_time=showtime.time,
            format=showtime.format,
        )
        db.add(new_booking)
        db.flush()

        for seat_num in clean_seats:
            db.add(
                BookedSeat(
                    booking_id=new_booking.id,
                    showtime_id=showtime.id,
                    seat_number=seat_num,
                    status="CONFIRMED",
                )
            )

        db.commit()
        db.refresh(new_booking)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Conflict detected: One or more of your chosen seats were booked in a "
                "concurrent transaction. Please select alternative seats."
            ),
        )

    return booking_to_response(new_booking, clean_seats)
