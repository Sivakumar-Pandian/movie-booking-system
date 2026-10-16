from fastapi import APIRouter

from app.models import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/api/health", response_model=HealthResponse, summary="Health check endpoint")
def get_health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        app="Yozigo Cinema Backend",
        version="1.0.0",
    )
