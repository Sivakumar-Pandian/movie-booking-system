import json
import re
from datetime import datetime, timedelta
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_admin
from app.database import get_db
from app.db_models import BookedSeat, Booking, Movie, Showtime, User
from app.models import AdminShowReport, MovieResponse, MovieUpsert, ShowtimeCreate
from app.catalog import movie_to_response

router = APIRouter(prefix="/api/admin", tags=["Admin"])


def duration_minutes(value: str) -> int:
    hours = re.search(r"(\d+)h", value)
    minutes = re.search(r"(\d+)m", value)
    return (int(hours.group(1)) * 60 if hours else 0) + (int(minutes.group(1)) if minutes else 0)


def to_movie(payload: MovieUpsert, record: Movie | None = None) -> Movie:
    movie = record or Movie(id=payload.id)
    movie.title, movie.duration, movie.language = payload.title, payload.duration, payload.language
    movie.certification, movie.poster_url, movie.synopsis = payload.certification, payload.poster_url, payload.synopsis
    movie.rating, movie.votes, movie.release_year = payload.rating, payload.votes, payload.release_year
    movie.genre_json, movie.formats_json = json.dumps(payload.genre), json.dumps(payload.formats)
    return movie


@router.get("/movies", response_model=List[MovieResponse])
def admin_movies(_: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    return [movie_to_response(movie) for movie in db.query(Movie).order_by(Movie.title).all()]


@router.post("/movies", response_model=MovieResponse, status_code=status.HTTP_201_CREATED)
def add_movie(payload: MovieUpsert, _: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    if db.query(Movie).filter(Movie.id == payload.id).first():
        raise HTTPException(status_code=409, detail="A movie with this ID already exists.")
    movie = to_movie(payload)
    db.add(movie); db.commit(); db.refresh(movie)
    return movie_to_response(movie)


@router.put("/movies/{movie_id}", response_model=MovieResponse)
def edit_movie(movie_id: str, payload: MovieUpsert, _: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie: raise HTTPException(status_code=404, detail="Movie not found.")
    if payload.id != movie_id: raise HTTPException(status_code=400, detail="Movie ID cannot be changed.")
    to_movie(payload, movie); db.commit(); db.refresh(movie)
    return movie_to_response(movie)


@router.delete("/movies/{movie_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_movie(movie_id: str, _: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie: raise HTTPException(status_code=404, detail="Movie not found.")
    if db.query(Booking).join(Showtime).filter(Showtime.movie_id == movie_id).first():
        raise HTTPException(status_code=409, detail="Movies with bookings cannot be deleted.")
    db.delete(movie); db.commit()


@router.post("/showtimes", status_code=status.HTTP_201_CREATED)
def add_showtime(payload: ShowtimeCreate, _: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    movie = db.query(Movie).filter(Movie.id == payload.movie_id).first()
    if not movie: raise HTTPException(status_code=404, detail="Movie not found.")
    if db.query(Showtime).filter(Showtime.id == payload.id).first(): raise HTTPException(status_code=409, detail="Showtime ID already exists.")
    try: start = datetime.strptime(f"{payload.show_date} {payload.time}", "%Y-%m-%d %I:%M %p")
    except ValueError: raise HTTPException(status_code=422, detail="Use ISO date and a 12-hour time such as 07:30 PM.")
    end = start + timedelta(minutes=duration_minutes(movie.duration))
    existing = db.query(Showtime).join(Movie).filter(Showtime.theater_id == payload.theater_id, Showtime.show_date == payload.show_date).all()
    for other in existing:
        other_start = datetime.strptime(f"{other.show_date} {other.time}", "%Y-%m-%d %I:%M %p")
        other_end = other_start + timedelta(minutes=duration_minutes(other.movie.duration))
        if start < other_end and other_start < end:
            raise HTTPException(status_code=409, detail="This show overlaps an existing show on the screen.")
    db.add(Showtime(**payload.model_dump())); db.commit()
    return {"detail": "Showtime created."}


@router.delete("/showtimes/{showtime_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_showtime(showtime_id: str, _: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    show = db.query(Showtime).filter(Showtime.id == showtime_id).first()
    if not show: raise HTTPException(status_code=404, detail="Showtime not found.")
    if db.query(Booking).filter(Booking.showtime_id == showtime_id).first():
        raise HTTPException(status_code=409, detail="A show with bookings cannot be deleted.")
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

