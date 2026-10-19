import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import SessionLocal, ensure_database_schema
from app.routers import admin, auth, bookings, health, movies
from app.seed import seed_database_if_empty


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Lightweight compatibility migration for existing databases before roles
    # were introduced. Production deployments should use a migration tool.
    ensure_database_schema()
    db = SessionLocal()
    try:
        seed_database_if_empty(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Yozigo Cinema Ticket Booking API",
    description="Movies, showtimes, JWT auth, and concurrency-safe seat bookings on Neon Postgres.",
    version="1.0.0",
    lifespan=lifespan,
)

CORS_ORIGINS_ENV = os.getenv("CORS_ORIGINS", "*")
if CORS_ORIGINS_ENV == "*":
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r".*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    origins = [orig.strip() for orig in CORS_ORIGINS_ENV.split(",") if orig.strip()]
    origins.extend(["http://localhost:5173", "http://127.0.0.1:5173"])
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(health.router)
app.include_router(movies.router)
app.include_router(auth.router)
app.include_router(bookings.router)
app.include_router(admin.router)
