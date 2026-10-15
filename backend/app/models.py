from typing import List, Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Health check response schema."""
    status: str = Field(default="ok", description="Server operational status")
    app: str = Field(default="Yozigo Cinema Backend", description="API application title")
    version: str = Field(default="1.0.0", description="API version")


class MovieResponse(BaseModel):
    """Pydantic model representing movie details returned to frontend."""
    id: str = Field(..., description="Unique movie identifier, e.g. 'm1'")
    title: str = Field(..., description="Full movie title")
    genre: List[str] = Field(..., description="List of genres")
    duration: str = Field(..., description="Formatted runtime, e.g. '2h 49m'")
    rating: float = Field(..., description="Critic/Audience rating score out of 10")
    votes: str = Field(..., description="Total votes count formatted, e.g. '248.6K'")
    certification: str = Field(..., description="Cinema film certification, e.g. 'UA 13+'")
    formats: List[str] = Field(..., description="Screen formats, e.g. ['IMAX 3D', '4DX']")
    releaseYear: int = Field(..., description="Release year")
    language: str = Field(..., description="Primary audio language")
    synopsis: str = Field(..., description="Story summary and description")
    posterUrl: str = Field(..., description="High-resolution poster image URL")
    backdropUrl: Optional[str] = Field(default=None, description="Cinematic widescreen banner URL")
    isFeatured: Optional[bool] = Field(default=False, description="Flag for hero marquee premiere")
    director: Optional[str] = Field(default=None, description="Film director name")
    cast: Optional[List[str]] = Field(default=None, description="Starring cast list")
    trailerYoutubeId: Optional[str] = Field(default=None, description="YouTube trailer teaser ID")
