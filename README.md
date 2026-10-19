# 🎟️ Yozigo — Full-Stack Movie Ticket Booking System

A production-grade, end-to-end Movie Ticket Booking web application built with a **React + TypeScript + Vite** frontend and a **FastAPI + SQLAlchemy** backend.

---

## 🚀 Key Features

- **Cinematic Movie Catalog**: Live movie catalog dynamically loaded from the FastAPI backend with genre/format filtering, search, and trailer popups.
- **Showtime & Theater Selection**: Multi-day scheduling across flagship cinema locations (IMAX 3D, 4DX, Dolby Cinema).
- **Interactive Seat Matrix**: Real-time cinema seating chart with visual screen indicator, aisle layout, seat tier pricing, and live synchronized booked seats.
- **Seat Holds**: Selected seats are held for five minutes before payment; expired holds are released automatically.
- **Double Booking Prevention**: Robust dual-layer concurrency protection:
  - Database-level `UniqueConstraint("showtime_id", "seat_number", name="uq_showtime_seat")`
  - Explicit database transaction checks with automatic rollback and `409 Conflict` status code responses.
- **Authentication & Security**:
  - Secure password hashing using `bcrypt` (12 rounds).
  - Stateless JSON Web Token (`JWT`) authentication with Bearer tokens.
  - Role-ready user registration and login endpoints.
- **Simulated Payment Gateway**: Instant mock checkout with UPI, Credit/Debit card, and Net Banking options with success/failure simulation modes.
- **My Bookings Dashboard**: Authenticated user dashboard displaying all confirmed digital tickets with unique references (`YZG-...`).

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Vanilla CSS (CSS variables, glassmorphism, responsive grid & flexbox)
- **Icons & Typography**: Outfit, Plus Jakarta Sans, SVG assets

### Backend
- **Framework**: FastAPI (Python 3.12)
- **ASGI Server**: Uvicorn
- **ORM & Database**: SQLAlchemy 2.0 with support for PostgreSQL and SQLite
- **Authentication**: `bcrypt`, `python-jose` (HS256 JWT)
- **Validation**: Pydantic v2 with `email-validator`
- **Testing**: `pytest` with `httpx` test client

---

## 📂 Project Structure

```text
movie-booking-system/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── auth.py             # Bcrypt hashing & JWT verification
│   │   ├── database.py         # SQLAlchemy engine & session factory
│   │   ├── db_models.py        # SQLAlchemy ORM models (User, Movie, Booking, BookedSeat)
│   │   ├── main.py             # FastAPI application routes & exception handlers
│   │   ├── models.py           # Pydantic request/response schemas
│   │   └── seed.py             # Database seed data script
│   ├── tests/
│   │   └── test_api.py         # Pytest automated test suite (auth, movies, double-booking)
│   ├── requirements.txt        # Backend Python dependencies
│   ├── .env.example            # Backend environment variables template
│   └── yozigo.db               # SQLite database file
├── src/
│   ├── components/             # Reusable React components
│   │   ├── AuthModal.tsx       # Sign In / Register dialog
│   │   ├── MyBookingsModal.tsx # User booking history dashboard
│   │   ├── BookingSummary.tsx  # Pricing summary & payment gateway
│   │   ├── SeatSelection.tsx   # Cinema seat matrix with live DB sync
│   │   ├── ShowtimeSelection.tsx # Date & showtime selector
│   │   ├── MovieGrid.tsx       # Movie card catalog & filters
│   │   ├── FeaturedMovie.tsx   # Hero marquee spotlight
│   │   └── Navbar.tsx          # Top navigation with user profile
│   ├── services/
│   │   ├── authApi.ts          # Auth HTTP client & token persistence
│   │   ├── bookingApi.ts       # Booking & seat availability HTTP client
│   │   └── movieApi.ts         # Movie catalog HTTP client
│   ├── types/                  # TypeScript interface definitions
│   ├── App.tsx                 # Root application state & router
│   ├── App.css                 # Application styling & tokens
│   └── main.tsx                # Frontend entrypoint
├── package.json
└── README.md
```

---

## ⚡ Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18 or newer) & **npm**
- **Python** (v3.10 or newer)

---

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Seed the local SQLite database explicitly; use a unique password for other environments
DATABASE_URL=sqlite:///./yozigo.db \
ADMIN_EMAIL=admin@yozigo.com \
ADMIN_PASSWORD='DemoAdmin2026!' \
ADMIN_FULL_NAME='Yozigo Admin' \
PYTHONPATH=. .venv/bin/python -m app.seed_admin

# Start the FastAPI server
DATABASE_URL=sqlite:///./yozigo.db uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The backend API will be available at:
- **API Root**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`
- **ReDoc Documentation**: `http://127.0.0.1:8000/redoc`

---

### 3. Frontend Setup

In a new terminal window:

```bash
# Navigate to the project root
cd movie-booking-system

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

The frontend will be running at `http://localhost:5173`.

---

## 🧪 Running Tests

### Backend Automated Tests
The backend includes automated tests validating health check, movie retrieval, user registration/login, and concurrency double-booking prevention:

```bash
cd backend
PYTHONPATH=. .venv/bin/pytest tests/test_api.py -v
```

### Frontend Typecheck & Build
Validate TypeScript typings and produce production client bundle:

```bash
npm run build
```

## 🔑 Seeded Test Accounts

The API creates the customer demo account on first start. Create the admin account by running the explicit seed command above. Public registration always creates a customer account.

| Role | Email | Password |
|---|---|---|
| Customer | `customer@yozigo.com` | `DemoCustomer2026!` |
| Admin (explicitly seeded) | `admin@yozigo.com` | `DemoAdmin2026!` |

The admin seed command requires `ADMIN_EMAIL` and `ADMIN_PASSWORD`. It creates that account or updates the matching account to the `ADMIN` role. The application does not automatically create a known-password admin at startup. The commands above explicitly target the local SQLite database; verify `DATABASE_URL` and use a unique password before running the seed for any shared or production environment.

## ✅ Task Flow Coverage

- Flows 1–6: customer registration/JWT authentication, dynamic movie and future-showtime data, an 8×10 live seat map, five-minute holds, mock payment confirmation/failure, protected booking history, and cancellation more than two hours before a show.
- Flow 7: protected admin APIs for movie CRUD, show creation/deletion, overlap validation, and per-show occupancy/revenue reporting.
- Flow 8: cancellation is implemented.
- Flow 9: admin reporting API is implemented.
- Flow 10: the customer seat map polls the API every five seconds.

## 🧭 Main Design Decisions

- FastAPI and SQLAlchemy keep API validation, transactions, and database constraints close together.
- PostgreSQL is supported for deployment; SQLite is the zero-configuration local-development default.
- Passwords are hashed with bcrypt and access is protected using signed JWT bearer tokens.
- A `UNIQUE(showtime_id, seat_number)` constraint is the final guard against double booking.
- Temporary `seat_holds` are user-owned, expire after five minutes, and use a unique seat/showtime constraint to prevent competing holds.
- The backend calculates ticket prices from the selected showtime and does not trust client-submitted totals.
- Seat availability uses five-second polling: it is simple, reliable, and sufficient for this small application.
- Admin actions are authorized server-side using an explicitly seeded `ADMIN` role; normal sign-up cannot create an admin.

---

## 🔒 Concurrency & Double Booking Prevention

When two users concurrently attempt to book the same seats for a showtime, Yozigo prevents double booking using two defensive layers:

1. **Transaction-level verification**: Queries `BookedSeat` within the atomic transaction before booking creation.
2. **Database Unique Constraint**:
   ```python
   __table_args__ = (
       UniqueConstraint("showtime_id", "seat_number", name="uq_showtime_seat"),
   )
   ```
   If a race condition occurs, the database rejects the duplicate with an `IntegrityError`, the session automatically rolls back, and the client receives:
   ```json
   HTTP 409 Conflict
   {
     "detail": "Seats C3 have already been booked by another user. Please choose different seats."
   }
   ```

---

## 🗄️ Database Design

![Database design](database%20design.png)

---

## 📡 API Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/health` | Service health status | No |
| `GET` | `/api/movies` | List all available movies | No |
| `GET` | `/api/movies/{id}` | Get specific movie details | No |
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Login and receive JWT access token | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Yes (`Bearer`) |
| `GET` | `/api/showtimes/{id}/seats`| Get currently booked seat IDs | No |
| `POST` | `/api/bookings` | Create atomic booking (prevents double booking) | Yes (`Bearer`) |
| `GET` | `/api/bookings` | List user's past bookings | Yes (`Bearer`) |
