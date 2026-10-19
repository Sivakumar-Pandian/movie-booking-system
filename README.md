# Yozigo Cinema

Yozigo is a full-stack movie ticket booking application. Browse movies and showtimes, select seats, place a short-lived seat hold, and complete a simulated checkout. The admin tools support movie and showtime management.

## Features

- Movie catalog with search, filtering, movie details, and trailers.
- Theater, show date, and showtime selection.
- Interactive seat map with booked-seat and temporary-hold availability.
- User registration, login, and authenticated booking history.
- Five-minute seat holds and simulated payment.
- Booking cancellation when the show is more than two hours away.
- Admin dashboard for movie management, with admin APIs for managing showtimes and viewing show reports.
- Database-enforced seat uniqueness to prevent double bookings.

## Technology

| Application | Stack |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, CSS |
| Backend | Python, FastAPI, SQLAlchemy, Pydantic |
| Database | SQLite for local development; PostgreSQL supported |
| Authentication | bcrypt password hashing and signed JWT bearer tokens |
| Tests | pytest and FastAPI TestClient |

## Requirements

- Node.js and npm
- Python 3.10 or newer

## Run locally

Start the backend and frontend in separate terminals.

### 1. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
# Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Optional but strongly recommended: configure a private signing key.
export JWT_SECRET_KEY='replace-with-a-long-random-secret'

uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The backend defaults to SQLite at `backend/yozigo.db`. On startup it creates the database schema and seeds sample movies, theaters, showtimes, and a customer demo account.

API documentation is available at:

- Swagger UI: <http://127.0.0.1:8000/docs>
- ReDoc: <http://127.0.0.1:8000/redoc>
- Health check: <http://127.0.0.1:8000/api/health>

### 2. Frontend

In another terminal, from the repository root:

```bash
npm install
npm run dev
```

Open <http://localhost:5173>. During local development, API requests default to `http://localhost:8000`. To use another backend, set `VITE_API_BASE_URL` in a root `.env.local` file:

```dotenv
VITE_API_BASE_URL=http://localhost:8000
```

### Demo customer account

The backend creates this customer account when it initializes an empty database:

| Email | Password |
| --- | --- |
| `customer@yozigo.com` | `DemoCustomer2026!` |

Use demo credentials only for local development. Public registration creates customer accounts; it does not grant administrator access.

### Create an administrator

Admin accounts are created explicitly, not automatically. From the `backend` directory with the virtual environment active:

```bash
ADMIN_EMAIL=admin@example.com \
ADMIN_PASSWORD='replace-with-a-unique-password' \
ADMIN_FULL_NAME='Cinema Admin' \
PYTHONPATH=. python -m app.seed_admin
```

The command uses the configured `DATABASE_URL` (SQLite by default) and creates the account or updates the matching account to the `ADMIN` role. Do not use a demo or shared password on a hosted database. For a Vercel production database, run the seed command through Vercel's environment rather than copying production secrets into a local `.env` file:

```bash
ADMIN_EMAIL=admin@example.com \
ADMIN_PASSWORD='replace-with-a-unique-password' \
ADMIN_FULL_NAME='Cinema Admin' \
vercel env run --environment production --cwd backend -- .venv/bin/python -m app.seed_admin
```

## Configuration

| Variable | Used by | Description |
| --- | --- | --- |
| `DATABASE_URL` | Backend | SQLAlchemy connection URL. Defaults to `sqlite:///./yozigo.db`; PostgreSQL URLs are supported. |
| `JWT_SECRET_KEY` | Backend | Secret used to sign access tokens. Set a long, random value outside local development. |
| `CORS_ORIGINS` | Backend | Optional comma-separated allowed origins. Defaults to `*`; local Vite origins are also allowed when explicitly set. |
| `VITE_API_BASE_URL` | Frontend build | Optional API base URL. Defaults to `http://localhost:8000` in Vite development and same-origin `/api` requests in production. |
| `ADMIN_EMAIL` | Admin seed command | Email address for the account to create or promote. |
| `ADMIN_PASSWORD` | Admin seed command | Password for the account to create or update; at least 8 characters. |
| `ADMIN_FULL_NAME` | Admin seed command | Optional display name; defaults to `Yozigo Admin`. |

Keep secrets out of source control. Configure hosted environment variables in the relevant deployment environment. For PostgreSQL deployments, install the dependencies from `backend/requirements.txt`; the application handles the common `postgres://` and `postgresql://` URL schemes.

## API overview

Interactive schemas and request/response details are available at `/docs` while the backend is running.

| Method | Endpoint | Description | Authentication |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Health check | No |
| `GET` | `/api/movies` | List movies | No |
| `GET` | `/api/movies/{movie_id}` | Get movie details | No |
| `GET` | `/api/movies/{movie_id}/show-dates` | List dates with showtimes | No |
| `GET` | `/api/movies/{movie_id}/theaters?date=YYYY-MM-DD` | List theaters and showtimes for a date | No |
| `POST` | `/api/auth/register` | Register and receive an access token | No |
| `POST` | `/api/auth/login` | Log in and receive an access token | No |
| `GET` | `/api/auth/me` | Get the current user | Bearer token |
| `GET` | `/api/showtimes/{showtime_id}/seats` | Get booked and held seats | No |
| `POST` | `/api/holds` | Hold seats temporarily | Bearer token |
| `POST` | `/api/payments` | Confirm a simulated payment | Bearer token |
| `POST` | `/api/bookings` | Create a booking | Bearer token |
| `GET` | `/api/bookings` | List the current user's bookings | Bearer token |
| `POST` | `/api/bookings/{booking_ref}/cancel` | Cancel an eligible booking | Bearer token |
| `GET`, `POST` | `/api/admin/movies` | List or add movies | Admin bearer token |
| `PUT`, `DELETE` | `/api/admin/movies/{movie_id}` | Update or delete a movie | Admin bearer token |
| `GET`, `POST` | `/api/admin/showtimes` | List or add showtimes | Admin bearer token |
| `PUT`, `DELETE` | `/api/admin/showtimes/{showtime_id}` | Update or delete a showtime | Admin bearer token |
| `GET` | `/api/admin/reports/shows` | Show occupancy and revenue reports | Admin bearer token |

## Tests and production build

Run the backend tests from the `backend` directory with the virtual environment active:

```bash
PYTHONPATH=. pytest -q
```

Build the frontend from the repository root:

```bash
npm run build
```

Other frontend scripts:

```bash
npm run lint
npm run preview
```

## Deployment

The included [`vercel.json`](./vercel.json) configures Vercel's `frontend` and `backend` services, routing `/api/*` requests to FastAPI and other requests to the Vite frontend. Configure a PostgreSQL `DATABASE_URL` and a strong `JWT_SECRET_KEY` in the deployment environment before publishing. Set `CORS_ORIGINS` when the API is accessed from a separate frontend origin.

## Project layout

```text
.
├── backend/
│   ├── app/
│   │   ├── routers/       # Health, movie, auth, booking, and admin APIs
│   │   ├── auth.py        # Password hashing and JWT authentication
│   │   ├── database.py    # SQLAlchemy engine and database setup
│   │   ├── db_models.py   # Database models
│   │   ├── models.py      # API schemas
│   │   ├── seed.py        # Sample catalog and customer data
│   │   └── seed_admin.py  # Explicit administrator seeding
│   ├── tests/             # Backend API tests
│   └── requirements.txt
├── public/                # Static public assets
├── src/
│   ├── components/        # React UI components
│   ├── data/              # Frontend catalog and seat data
│   ├── services/          # API clients
│   └── types/             # TypeScript types
├── package.json
├── vercel.json
└── README.md
```

## Database design

![Yozigo database design](./system%20design.png)
