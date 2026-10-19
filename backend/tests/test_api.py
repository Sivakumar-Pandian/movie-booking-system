import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, ensure_database_schema, get_db
from app.main import app
from app.seed import seed_database_if_empty
from app.seed_admin import seed_admin_account

# Setup in-memory SQLite database specifically for clean, isolated test runs
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    seed_database_if_empty(db)
    seed_admin_account(db, "admin@yozigo.com", "DemoAdmin2026!", "Yozigo Admin")
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


# 1. Health & Movies
def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "Yozigo" in data["app"]


def test_get_movies():
    response = client.get("/api/movies")
    assert response.status_code == 200
    movies = response.json()
    assert len(movies) > 0
    assert "title" in movies[0]
    assert "duration" in movies[0]
    assert "formats" in movies[0]


# 2. Authentication Flow
def test_user_registration_and_login():
    reg_payload = {
        "email": "sarah.connor@cinema.org",
        "password": "SecurePassword123!",
        "full_name": "Sarah Connor",
    }
    # Register
    reg_res = client.post("/api/auth/register", json=reg_payload)
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["email"] == "sarah.connor@cinema.org"
    token = reg_data["access_token"]

    # Duplicate registration should return 400
    dup_res = client.post("/api/auth/register", json=reg_payload)
    assert dup_res.status_code == 400

    # Login
    login_res = client.post(
        "/api/auth/login",
        json={"email": "sarah.connor@cinema.org", "password": "SecurePassword123!"},
    )
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

    # Invalid login password
    bad_login = client.post(
        "/api/auth/login",
        json={"email": "sarah.connor@cinema.org", "password": "WrongPassword"},
    )
    assert bad_login.status_code == 401

    # /api/auth/me with Bearer token
    me_res = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "sarah.connor@cinema.org"

    # /api/auth/me without token -> 401
    anon_res = client.get("/api/auth/me")
    assert anon_res.status_code == 401


# 3. Booking Creation & Double Booking Prevention
def test_booking_and_double_booking_prevention():
    # Register buyer 1
    buyer1 = client.post(
        "/api/auth/register",
        json={
            "email": "john.wick@highcontinental.com",
            "password": "ContinentalKey456!",
            "full_name": "John Wick",
        },
    ).json()
    token1 = buyer1["access_token"]

    # Register buyer 2
    buyer2 = client.post(
        "/api/auth/register",
        json={
            "email": "winston@highcontinental.com",
            "password": "ManagerPass789!",
            "full_name": "Winston Scott",
        },
    ).json()
    token2 = buyer2["access_token"]

    # Use a seeded future showtime instead of relying on an old fixed ID.
    dates_res = client.get("/api/movies/m1/show-dates")
    assert dates_res.status_code == 200
    show_date = dates_res.json()[0]
    theaters_res = client.get(f"/api/movies/m1/theaters?date={show_date}")
    assert theaters_res.status_code == 200
    showtime_id = theaters_res.json()[0]["showtimes"][0]["id"]

    # Buyer 1 books seats A1 and A2
    booking_payload = {
        "showtime_id": showtime_id,
        "movie_title": "Interstellar: Beyond Horizons",
        "theater_name": "PVR INOX: Forum South Mall",
        "show_date": "Today",
        "show_time": "10:30 AM",
        "format": "IMAX 3D",
        "seats": ["A1", "A2"],
        "payment_method": "upi",
        "price_per_seat": 380,
        "subtotal": 760,
        "convenience_fee": 56,
        "total_amount": 816,
    }

    book_res1 = client.post(
        "/api/bookings",
        json=booking_payload,
        headers={"Authorization": f"Bearer {token1}"},
    )
    assert book_res1.status_code == 201
    booking1 = book_res1.json()
    assert booking1["booking_ref"].startswith("YZG-")
    assert booking1["seat_count"] == 2
    assert "A1" in booking1["seats"]
    assert "A2" in booking1["seats"]

    # Verify seats are now recorded as booked
    seats_res = client.get(f"/api/showtimes/{showtime_id}/seats")
    assert seats_res.status_code == 200
    booked_list = seats_res.json()["booked_seats"]
    assert "A1" in booked_list
    assert "A2" in booked_list

    # DOUBLE BOOKING TEST:
    # Buyer 2 attempts to book seats A2 (already taken) and A3
    double_payload = {
        "showtime_id": showtime_id,
        "movie_title": "Interstellar: Beyond Horizons",
        "theater_name": "PVR INOX: Forum South Mall",
        "show_date": "Today",
        "show_time": "10:30 AM",
        "format": "IMAX 3D",
        "seats": ["A2", "A3"], # A2 is conflict!
        "payment_method": "card",
        "price_per_seat": 380,
        "subtotal": 760,
        "convenience_fee": 56,
        "total_amount": 816,
    }

    conflict_res = client.post(
        "/api/bookings",
        json=double_payload,
        headers={"Authorization": f"Bearer {token2}"},
    )
    # MUST return 409 Conflict
    assert conflict_res.status_code == 409
    assert "already been booked" in conflict_res.json()["detail"] or "Conflict" in conflict_res.json()["detail"]

    # Verify A3 was NOT booked because atomic transaction rolled back
    seats_res2 = client.get(f"/api/showtimes/{showtime_id}/seats")
    assert "A3" not in seats_res2.json()["booked_seats"]

    # Verify Buyer 1 sees their booking in /api/bookings
    my_bookings_res = client.get(
        "/api/bookings",
        headers={"Authorization": f"Bearer {token1}"},
    )
    assert my_bookings_res.status_code == 200
    user1_bookings = my_bookings_res.json()
    assert len(user1_bookings) >= 1
    assert user1_bookings[0]["booking_ref"] == booking1["booking_ref"]


def test_admin_login_and_customer_cannot_access_admin_api():
    login_res = client.post(
        "/api/auth/login",
        json={"email": "admin@yozigo.com", "password": "DemoAdmin2026!"},
    )
    assert login_res.status_code == 200
    assert login_res.json()["user"]["role"] == "ADMIN"
    admin_token = login_res.json()["access_token"]

    customer = client.post(
        "/api/auth/register",
        json={
            "email": "regular@yozigo.com",
            "password": "CustomerPass123!",
            "full_name": "Regular Customer",
            "role": "ADMIN",
        },
    )
    assert customer.status_code == 201
    assert customer.json()["user"]["role"] == "CUSTOMER"
    denied = client.get(
        "/api/admin/movies",
        headers={"Authorization": f"Bearer {customer.json()['access_token']}"},
    )
    assert denied.status_code == 403

    allowed = client.get(
        "/api/admin/movies",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert allowed.status_code == 200


def test_admin_movie_crud_and_showtime_overlap_validation():
    login_res = client.post(
        "/api/auth/login",
        json={"email": "admin@yozigo.com", "password": "DemoAdmin2026!"},
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    movie = {
        "title": "Admin CRUD Test",
        "duration": "2h 0m",
        "language": "English",
        "certification": "UA",
        "poster_url": "https://placehold.co/300x450",
        "backdrop_url": "https://placehold.co/1600x900",
        "trailer_youtube_id": "dQw4w9WgXcQ",
        "synopsis": "Admin CRUD test movie",
        "rating": 7.5,
        "votes": "10",
        "genre": ["Drama"],
        "formats": ["2D"],
        "release_year": 2026,
    }

    created = client.post("/api/admin/movies", json=movie, headers=headers)
    assert created.status_code == 201
    movie_id = created.json()["id"]
    assert movie_id == "admin-crud-test"
    assert created.json()["backdropUrl"] == movie["backdrop_url"]
    assert created.json()["trailerYoutubeId"] == movie["trailer_youtube_id"]
    duplicate_title = client.post("/api/admin/movies", json=movie, headers=headers)
    assert duplicate_title.status_code == 201
    assert duplicate_title.json()["id"] == "admin-crud-test-2"
    client.delete(f"/api/admin/movies/{duplicate_title.json()['id']}", headers=headers)
    updated_movie = {**movie, "title": "Updated Admin CRUD Test"}
    updated = client.put(
        f"/api/admin/movies/{movie_id}",
        json=updated_movie,
        headers=headers,
    )
    assert updated.status_code == 200
    assert updated.json()["title"] == updated_movie["title"]
    assert updated.json()["backdropUrl"] == updated_movie["backdrop_url"]
    assert updated.json()["trailerYoutubeId"] == updated_movie["trailer_youtube_id"]
    deleted = client.delete(f"/api/admin/movies/{movie_id}", headers=headers)
    assert deleted.status_code == 204

    movie_with_schedule = client.delete("/api/admin/movies/m2", headers=headers)
    assert movie_with_schedule.status_code == 409
    assert "showtimes" in movie_with_schedule.json()["detail"]

    from datetime import date, timedelta

    show_date = (date.today() + timedelta(days=1)).isoformat()
    overlapping_show = {
        "id": "admin-overlap-test",
        "movie_id": "m1",
        "theater_id": "th-1",
        "show_date": show_date,
        "time": "11:00 AM",
        "format": "2D",
        "price": 250,
    }
    overlap = client.post("/api/admin/showtimes", json=overlapping_show, headers=headers)
    assert overlap.status_code == 409
    assert "overlaps" in overlap.json()["detail"]

    available_show = {**overlapping_show, "id": "admin-non-overlap-test", "time": "06:00 AM"}
    created_show = client.post("/api/admin/showtimes", json=available_show, headers=headers)
    assert created_show.status_code == 201
    deleted_show = client.delete(
        f"/api/admin/showtimes/{available_show['id']}",
        headers=headers,
    )
    assert deleted_show.status_code == 204


def test_admin_cannot_delete_movie_or_showtime_with_bookings():
    login_res = client.post(
        "/api/auth/login",
        json={"email": "admin@yozigo.com", "password": "DemoAdmin2026!"},
    )
    headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}

    dates = client.get("/api/movies/m1/show-dates").json()
    theaters = client.get(f"/api/movies/m1/theaters?date={dates[0]}").json()
    booked_showtime_id = theaters[0]["showtimes"][0]["id"]
    show_delete = client.delete(f"/api/admin/showtimes/{booked_showtime_id}", headers=headers)
    assert show_delete.status_code == 409

    movie_delete = client.delete("/api/admin/movies/m1", headers=headers)
    assert movie_delete.status_code == 409


def test_admin_can_add_standard_showtimes_and_edit_a_show():
    from datetime import date, timedelta

    login_res = client.post(
        "/api/auth/login",
        json={"email": "admin@yozigo.com", "password": "DemoAdmin2026!"},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": "Bearer " + token}
    movie_payload = {
        "title": "Standard Schedule Test",
        "duration": "2h 0m",
        "language": "English",
        "certification": "UA",
        "poster_url": "https://placehold.co/300x450",
        "formats": ["2D"],
        "release_year": 2026,
    }
    created_movie = client.post("/api/admin/movies", json=movie_payload, headers=headers)
    assert created_movie.status_code == 201
    movie_id = created_movie.json()["id"]
    show_date = (date.today() + timedelta(days=10)).isoformat()
    standard = client.post(
        "/api/admin/showtimes/standard",
        json={
            "movie_id": movie_id,
            "theater_ids": ["th-1"],
            "show_date": show_date,
            "times": ["10:00 AM", "01:30 PM", "05:00 PM", "08:30 PM"],
            "format": "2D",
            "price": 250,
        },
        headers=headers,
    )
    assert standard.status_code == 201

    showtimes = client.get(f"/api/admin/showtimes?movie_id={movie_id}", headers=headers).json()
    assert len(showtimes) == 4
    assert all(show["theater_id"] == "th-1" for show in showtimes)
    assert all(show["price"] == 250 for show in showtimes)

    show = next(item for item in showtimes if item["time"] == "10:00 AM")
    updated = client.put(
        f"/api/admin/showtimes/{show['id']}",
        json={
            "show_date": show_date,
            "time": "10:15 AM",
            "format": "2D",
            "price": 300,
        },
        headers=headers,
    )
    assert updated.status_code == 200
    assert updated.json()["time"] == "10:15 AM"
    assert updated.json()["price"] == 300

    for scheduled_show in showtimes:
        deleted_show = client.delete(
            f"/api/admin/showtimes/{scheduled_show['id']}",
            headers=headers,
        )
        assert deleted_show.status_code == 204
    deleted_movie = client.delete(f"/api/admin/movies/{movie_id}", headers=headers)
    assert deleted_movie.status_code == 204


def test_schema_migration_adds_role_to_legacy_users_table(monkeypatch):
    legacy_engine = create_engine("sqlite:///:memory:")
    with legacy_engine.begin() as connection:
        connection.execute(text(
            "CREATE TABLE users ("
            "id INTEGER PRIMARY KEY, email VARCHAR(255) NOT NULL, "
            "hashed_password VARCHAR(255) NOT NULL, full_name VARCHAR(255) NOT NULL, "
            "created_at DATETIME NOT NULL)"
        ))

    monkeypatch.setattr("app.database.engine", legacy_engine)
    ensure_database_schema()

    columns = {column["name"] for column in inspect(legacy_engine).get_columns("users")}
    assert "role" in columns
    legacy_engine.dispose()
