from collections import defaultdict
from typing import List

from sqlalchemy.orm import Session, joinedload

from app.db_models import BookedSeat, Movie, Showtime
from app.models import MovieResponse, ShowtimeSlotResponse, TheaterShowtimesResponse

SEAT_CAPACITY = 60


def movie_to_response(movie: Movie) -> MovieResponse:
    return MovieResponse(
        id=movie.id,
        title=movie.title,
        genre=movie.genre,
        duration=movie.duration,
        rating=movie.rating,
        votes=movie.votes,
        certification=movie.certification,
        formats=movie.formats,
        releaseYear=movie.release_year,
        language=movie.language,
        synopsis=movie.synopsis,
        posterUrl=movie.poster_url,
        backdropUrl=movie.backdrop_url,
        isFeatured=movie.is_featured,
        director=movie.director,
        cast=movie.cast,
        trailerYoutubeId=movie.trailer_youtube_id,
    )


def occupancy_status(booked_count: int) -> str:
    ratio = booked_count / SEAT_CAPACITY if SEAT_CAPACITY else 0
    if ratio >= 0.7:
        return "Almost Full"
    if ratio >= 0.4:
        return "Filling Fast"
    return "Available"


def theaters_for_movie(
    db: Session,
    movie_id: str,
    show_date: str,
) -> List[TheaterShowtimesResponse]:
    slots = (
        db.query(Showtime)
        .options(joinedload(Showtime.theater))
        .filter(Showtime.movie_id == movie_id, Showtime.show_date == show_date)
        .order_by(Showtime.theater_id, Showtime.time)
        .all()
    )
    if not slots:
        return []

    showtime_ids = [s.id for s in slots]
    booked_rows = (
        db.query(BookedSeat.showtime_id, BookedSeat.seat_number)
        .filter(
            BookedSeat.showtime_id.in_(showtime_ids),
            BookedSeat.status == "CONFIRMED",
        )
        .all()
    )
    booked_counts: dict[str, int] = defaultdict(int)
    for showtime_id, _seat in booked_rows:
        booked_counts[showtime_id] += 1

    grouped: dict[str, TheaterShowtimesResponse] = {}
    order: List[str] = []
    for slot in slots:
        theater = slot.theater
        if theater.id not in grouped:
            grouped[theater.id] = TheaterShowtimesResponse(
                id=theater.id,
                name=theater.name,
                location=theater.location,
                distance=theater.distance,
                showtimes=[],
            )
            order.append(theater.id)
        grouped[theater.id].showtimes.append(
            ShowtimeSlotResponse(
                id=slot.id,
                time=slot.time,
                format=slot.format,
                status=occupancy_status(booked_counts[slot.id]),
                price=slot.price,
            )
        )
    return [grouped[theater_id] for theater_id in order]
