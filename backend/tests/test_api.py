import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.seed import seed_database_if_empty

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
