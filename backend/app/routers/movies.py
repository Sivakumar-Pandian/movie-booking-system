from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.catalog import movie_to_response, theaters_for_movie
from app.database import get_db
from app.db_models import Movie
from app.models import MovieResponse, TheaterShowtimesResponse

router = APIRouter(tags=["Movies"])


@router.get("/api/movies", response_model=List[MovieResponse], summary="Fetch all movies currently showing")
def get_movies(db: Session = Depends(get_db)) -> List[MovieResponse]:
    movies = db.query(Movie).order_by(Movie.id).all()
    return [movie_to_response(movie) for movie in movies]


@router.get("/api/movies/{movie_id}", response_model=MovieResponse, summary="Fetch movie details by ID")
def get_movie_detail(movie_id: str, db: Session = Depends(get_db)) -> MovieResponse:
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Movie with ID '{movie_id}' not found",
        )
    return movie_to_response(movie)


@router.get(
    "/api/movies/{movie_id}/theaters",
    response_model=List[TheaterShowtimesResponse],
    summary="List theaters and showtimes for a movie",
)
def get_movie_theaters(
    movie_id: str,
    date: str = Query(default="d1", description="Show date id, e.g. d1"),
    db: Session = Depends(get_db),
) -> List[TheaterShowtimesResponse]:
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Movie with ID '{movie_id}' not found",
        )
    return theaters_for_movie(db, movie_id, date)
