import json
import re
import unicodedata
import uuid
from datetime import datetime, timedelta
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_admin
from app.database import get_db
from app.db_models import BookedSeat, Booking, Movie, SeatHold, Showtime, Theater, User
from app.models import (
    AdminShowReport,
    AdminShowtimeResponse,
    AdminTheaterResponse,
    MovieResponse,
    MovieUpsert,
    ShowtimeCreate,
    ShowtimeUpdate,
    StandardShowtimesCreate,
)
from app.catalog import movie_to_response

router = APIRouter(prefix="/api/admin", tags=["Admin"])


def duration_minutes(value: str) -> int:
    hours = re.search(r"(\d+)h", value)
    minutes = re.search(r"(\d+)m", value)
    return (int(hours.group(1)) * 60 if hours else 0) + (int(minutes.group(1)) if minutes else 0)


def generate_movie_id(title: str, db: Session) -> str:
    normalized_title = unicodedata.normalize("NFKD", title).encode("ascii", "ignore").decode("ascii")
    base_id = re.sub(r"[^a-z0-9]+", "-", normalized_title.lower()).strip("-")[:50].rstrip("-") or "movie"
    candidate = base_id
    suffix_number = 2

    while db.query(Movie.id).filter(Movie.id == candidate).first():
        suffix = f"-{suffix_number}"
        candidate = f"{base_id[:50 - len(suffix)].rstrip('-')}{suffix}"
        suffix_number += 1

    return candidate


def to_movie(payload: MovieUpsert, movie_id: str, record: Movie | None = None) -> Movie:
    movie = record or Movie(id=movie_id)
    movie.title, movie.duration, movie.language = payload.title, payload.duration, payload.language
    movie.certification, movie.poster_url, movie.synopsis = payload.certification, payload.poster_url, payload.synopsis
    movie.backdrop_url, movie.trailer_youtube_id = payload.backdrop_url, payload.trailer_youtube_id
    movie.rating, movie.votes, movie.release_year = payload.rating, payload.votes, payload.release_year
    movie.genre_json, movie.formats_json = json.dumps(payload.genre), json.dumps(payload.formats)
    return movie


def parse_showtime(show_date: str, time: str) -> datetime:
    try:
        return datetime.strptime(f"{show_date} {time}", "%Y-%m-%d %I:%M %p")
    except ValueError as error:
        raise HTTPException(
            status_code=422,
            detail="Use an ISO date and a 12-hour time such as 07:30 PM.",
        ) from error


def ensure_no_showtime_overlap(
    db: Session,
    theater_id: str,
    show_date: str,
    start: datetime,
    duration: int,
    exclude_showtime_id: str | None = None,
) -> None:
    end = start + timedelta(minutes=duration)
    existing_shows = (
        db.query(Showtime)
        .join(Movie)
        .filter(Showtime.theater_id == theater_id, Showtime.show_date == show_date)
        .all()
    )

    for other in existing_shows:
        if other.id == exclude_showtime_id:
            continue
        try:
            other_start = parse_showtime(other.show_date, other.time)
        except HTTPException:
            continue
        other_end = other_start + timedelta(minutes=duration_minutes(other.movie.duration))
        if start < other_end and other_start < end:
            raise HTTPException(status_code=409, detail="This show overlaps an existing show on the screen.")


@router.get("/movies", response_model=List[MovieResponse])
def admin_movies(_: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    return [movie_to_response(movie) for movie in db.query(Movie).order_by(Movie.title).all()]


@router.get("/theaters", response_model=List[AdminTheaterResponse])
def admin_theaters(_: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    return db.query(Theater).order_by(Theater.name).all()


@router.get("/showtimes", response_model=List[AdminShowtimeResponse])
def admin_showtimes(
    _: User = Depends(get_current_admin),
    movie_id: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(Showtime).join(Movie).join(Theater)
    if movie_id:
        query = query.filter(Showtime.movie_id == movie_id)

    return [
        AdminShowtimeResponse(
            id=show.id,
            movie_id=show.movie_id,
            movie_title=show.movie.title,
            theater_id=show.theater_id,
            theater_name=show.theater.name,
            show_date=show.show_date,
            time=show.time,
            format=show.format,
            price=show.price,
            has_bookings=bool(db.query(Booking.id).filter(Booking.showtime_id == show.id).first()),
        )
        for show in query.order_by(Showtime.show_date, Theater.name, Showtime.time).all()
    ]


@router.post("/movies", response_model=MovieResponse, status_code=status.HTTP_201_CREATED)
def add_movie(payload: MovieUpsert, _: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    movie_id = payload.id or generate_movie_id(payload.title, db)
    if db.query(Movie).filter(Movie.id == movie_id).first():
        raise HTTPException(status_code=409, detail="A movie with this ID already exists.")
    movie = to_movie(payload, movie_id)
    db.add(movie); db.commit(); db.refresh(movie)
    return movie_to_response(movie)


@router.put("/movies/{movie_id}", response_model=MovieResponse)
def edit_movie(movie_id: str, payload: MovieUpsert, _: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie: raise HTTPException(status_code=404, detail="Movie not found.")
    if payload.id is not None and payload.id != movie_id: raise HTTPException(status_code=400, detail="Movie ID cannot be changed.")
    to_movie(payload, movie_id, movie); db.commit(); db.refresh(movie)
    return movie_to_response(movie)


@router.delete("/movies/{movie_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_movie(movie_id: str, _: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie: raise HTTPException(status_code=404, detail="Movie not found.")
    if db.query(Booking).join(Showtime).filter(Showtime.movie_id == movie_id).first():
        raise HTTPException(status_code=409, detail="Movies with bookings cannot be deleted.")
    if db.query(Showtime).filter(Showtime.movie_id == movie_id).first():
        raise HTTPException(status_code=409, detail="Delete this movie's showtimes before deleting the movie.")
    db.delete(movie); db.commit()


@router.post("/showtimes", status_code=status.HTTP_201_CREATED)
def add_showtime(payload: ShowtimeCreate, _: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    movie = db.query(Movie).filter(Movie.id == payload.movie_id).first()
    if not movie: raise HTTPException(status_code=404, detail="Movie not found.")
    theater = db.query(Theater).filter(Theater.id == payload.theater_id).first()
    if not theater: raise HTTPException(status_code=404, detail="Screen not found.")
    if db.query(Showtime).filter(Showtime.id == payload.id).first(): raise HTTPException(status_code=409, detail="Showtime ID already exists.")
    start = parse_showtime(payload.show_date, payload.time)
    ensure_no_showtime_overlap(
        db,
        payload.theater_id,
        payload.show_date,
        start,
        duration_minutes(movie.duration),
    )
    db.add(Showtime(**payload.model_dump())); db.commit()
    return {"detail": "Showtime created."}


@router.post("/showtimes/standard", status_code=status.HTTP_201_CREATED)
def add_standard_showtimes(
    payload: StandardShowtimesCreate,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    movie = db.query(Movie).filter(Movie.id == payload.movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found.")

    theaters = db.query(Theater).filter(Theater.id.in_(set(payload.theater_ids))).all()
    theaters_by_id = {theater.id: theater for theater in theaters}
    if len(theaters_by_id) != len(set(payload.theater_ids)):
        raise HTTPException(status_code=404, detail="One or more selected theaters were not found.")

    starts = [parse_showtime(payload.show_date, time) for time in payload.times]
    duration = duration_minutes(movie.duration)
    for theater_id in theaters_by_id:
        for start in starts:
            ensure_no_showtime_overlap(
                db,
                theater_id,
                payload.show_date,
                start,
                duration,
            )
        for index, start in enumerate(starts):
            for other_start in starts[index + 1:]:
                if start < other_start + timedelta(minutes=duration) and other_start < start + timedelta(minutes=duration):
                    raise HTTPException(status_code=409, detail="The selected standard showtimes overlap each other.")

    for theater_id in theaters_by_id:
        for start, time in zip(starts, payload.times):
            db.add(
                Showtime(
                    id=f"show-{uuid.uuid4().hex}",
                    movie_id=movie.id,
                    theater_id=theater_id,
                    show_date=payload.show_date,
                    time=time,
                    format=payload.format,
                    price=payload.price,
                )
            )
    db.commit()
    return {"detail": "Standard showtimes created."}


@router.put("/showtimes/{showtime_id}", response_model=AdminShowtimeResponse)
def edit_showtime(
    showtime_id: str,
    payload: ShowtimeUpdate,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    show = db.query(Showtime).filter(Showtime.id == showtime_id).first()
    if not show:
        raise HTTPException(status_code=404, detail="Showtime not found.")
    if db.query(Booking.id).filter(Booking.showtime_id == showtime_id).first():
        raise HTTPException(status_code=409, detail="A showtime with bookings cannot be changed.")

    start = parse_showtime(payload.show_date, payload.time)
    ensure_no_showtime_overlap(
        db,
        show.theater_id,
        payload.show_date,
        start,
        duration_minutes(show.movie.duration),
        exclude_showtime_id=show.id,
    )
    show.show_date = payload.show_date
    show.time = payload.time
    show.format = payload.format
    show.price = payload.price
    db.commit()
    db.refresh(show)
    return AdminShowtimeResponse(
        id=show.id,
        movie_id=show.movie_id,
        movie_title=show.movie.title,
        theater_id=show.theater_id,
        theater_name=show.theater.name,
        show_date=show.show_date,
        time=show.time,
        format=show.format,
        price=show.price,
        has_bookings=False,
    )


@router.delete("/showtimes/{showtime_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_showtime(showtime_id: str, _: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    show = db.query(Showtime).filter(Showtime.id == showtime_id).first()
    if not show: raise HTTPException(status_code=404, detail="Showtime not found.")
    if db.query(Booking).filter(Booking.showtime_id == showtime_id).first():
        raise HTTPException(status_code=409, detail="A show with bookings cannot be deleted.")
    db.query(SeatHold).filter(SeatHold.showtime_id == showtime_id).delete(synchronize_session=False)
    db.delete(show); db.commit()


@router.get("/reports/shows", response_model=List[AdminShowReport])
def show_reports(_: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    shows = db.query(Showtime).options(joinedload(Showtime.movie)).order_by(Showtime.show_date, Showtime.time).all()
    results = []
    for show in shows:
        count = db.query(func.count(BookedSeat.id)).filter(BookedSeat.showtime_id == show.id).scalar() or 0
        revenue = db.query(func.coalesce(func.sum(Booking.total_amount), 0)).filter(Booking.showtime_id == show.id, Booking.payment_status == "COMPLETED").scalar()
        results.append(AdminShowReport(showtime_id=show.id, movie_title=show.movie.title, show_date=show.show_date, time=show.time, booked_seats=count, occupancy_percent=round(count * 100 / 80, 1), total_collected=int(revenue)))
    return results
