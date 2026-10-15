from typing import List
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.models import HealthResponse, MovieResponse
from app.data import SAMPLE_MOVIES

# Initialize FastAPI application
app = FastAPI(
    title="Yozigo Cinema Ticket Booking API",
    description="Backend API services for Yozigo Movie Ticket Booking application",
    version="1.0.0",
)

# Configure CORS (Cross-Origin Resource Sharing)
# Security Requirement: Restrict strictly to Vite local frontend origin (NO wildcards!)
ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get(
    "/api/health",
    response_model=HealthResponse,
    tags=["Health"],
    summary="Health check endpoint",
)
def get_health() -> HealthResponse:
    """Return operational health status of the backend API."""
    return HealthResponse(
        status="ok",
        app="Yozigo Cinema Backend",
        version="1.0.0",
    )


@app.get(
    "/api/movies",
    response_model=List[MovieResponse],
    tags=["Movies"],
    summary="Fetch all movies currently showing",
)
def get_movies() -> List[MovieResponse]:
    """Return a typed list of currently showing and featured movies."""
    return SAMPLE_MOVIES
