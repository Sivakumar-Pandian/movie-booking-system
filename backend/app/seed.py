import json
from sqlalchemy.orm import Session
from app.db_models import Movie, Theater, Showtime
from app.data import SAMPLE_MOVIES

SAMPLE_THEATERS_SEED = [
    {
        "id": "th-1",
        "name": "PVR INOX: Forum South Mall, IMAX",
        "location": "Kanakapura Road, Bengaluru",
        "distance": "3.2 km away",
        "showtimes": [
            {"id": "st-1", "time": "10:30 AM", "format": "IMAX 3D", "price": 380},
            {"id": "st-2", "time": "01:45 PM", "format": "IMAX 3D", "price": 450},
            {"id": "st-3", "time": "05:30 PM", "format": "4DX", "price": 520},
            {"id": "st-4", "time": "09:15 PM", "format": "IMAX 3D", "price": 480},
        ],
    },
    {
        "id": "th-2",
        "name": "Cinépolis: Nexus Grand Screen & VIP",
        "location": "Koramangala, Bengaluru",
        "distance": "5.8 km away",
        "showtimes": [
            {"id": "st-5", "time": "11:15 AM", "format": "Dolby Atmos", "price": 320},
            {"id": "st-6", "time": "02:45 PM", "format": "2D", "price": 260},
            {"id": "st-7", "time": "06:30 PM", "format": "Dolby Atmos", "price": 360},
            {"id": "st-8", "time": "10:00 PM", "format": "Dolby Atmos", "price": 340},
        ],
    },
    {
        "id": "th-3",
        "name": "INOX: Garuda Megaplex",
        "location": "Magrath Road, Bengaluru",
        "distance": "7.1 km away",
        "showtimes": [
            {"id": "st-9", "time": "10:00 AM", "format": "2D", "price": 240},
            {"id": "st-10", "time": "01:15 PM", "format": "3D", "price": 290},
            {"id": "st-11", "time": "04:45 PM", "format": "3D", "price": 310},
            {"id": "st-12", "time": "08:15 PM", "format": "2D", "price": 280},
        ],
    },
]


def seed_database_if_empty(db: Session):
    """Seed or update movies, theaters, and showtimes."""
    # 1. Seed or Update Movies
    for m in SAMPLE_MOVIES:
        existing = db.query(Movie).filter(Movie.id == m.id).first()
        if existing:
            existing.title = m.title
            existing.genre_json = json.dumps(m.genre)
            existing.duration = m.duration
            existing.rating = m.rating
            existing.votes = m.votes
            existing.certification = m.certification
            existing.formats_json = json.dumps(m.formats)
            existing.release_year = m.releaseYear
            existing.language = m.language
            existing.synopsis = m.synopsis
            existing.poster_url = m.posterUrl
            existing.backdrop_url = m.backdropUrl
            existing.is_featured = m.isFeatured or False
            existing.director = m.director
            existing.cast_json = json.dumps(m.cast or [])
            existing.trailer_youtube_id = m.trailerYoutubeId
        else:
            movie_record = Movie(
                id=m.id,
                title=m.title,
                genre_json=json.dumps(m.genre),
                duration=m.duration,
                rating=m.rating,
                votes=m.votes,
                certification=m.certification,
                formats_json=json.dumps(m.formats),
                release_year=m.releaseYear,
                language=m.language,
                synopsis=m.synopsis,
                poster_url=m.posterUrl,
                backdrop_url=m.backdropUrl,
                is_featured=m.isFeatured or False,
                director=m.director,
                cast_json=json.dumps(m.cast or []),
                trailer_youtube_id=m.trailerYoutubeId,
            )
            db.add(movie_record)
    db.commit()

    # 2. Seed Theaters
    for th in SAMPLE_THEATERS_SEED:
        theater_exists = db.query(Theater).filter(Theater.id == th["id"]).first()
        if not theater_exists:
            theater_record = Theater(
                id=th["id"],
                name=th["name"],
                location=th["location"],
                distance=th["distance"],
            )
            db.add(theater_record)
    db.commit()

    # 3. Seed Showtimes for all movies and dates d1..d5
    existing_showtime_ids = {row[0] for row in db.query(Showtime.id).all()}
    dates = ["d1", "d2", "d3", "d4", "d5"]
    new_showtimes = []
    for m in SAMPLE_MOVIES:
        for th in SAMPLE_THEATERS_SEED:
            for st in th["showtimes"]:
                for dt in dates:
                    if m.id == "m1" and dt == "d1":
                        st_id = st["id"]
                    else:
                        st_id = f"{m.id}_{dt}_{st['id']}"

                    if st_id not in existing_showtime_ids:
                        new_showtimes.append(
                            Showtime(
                                id=st_id,
                                movie_id=m.id,
                                theater_id=th["id"],
                                show_date=dt,
                                time=st["time"],
                                format=st["format"],
                                price=st["price"],
                            )
                        )
                        existing_showtime_ids.add(st_id)
    if new_showtimes:
        db.add_all(new_showtimes)
    db.commit()
