import { useState } from 'react';
import type { Movie } from '../types/movie';

interface FeaturedMovieProps {
  movie: Movie;
  onBookTickets: (movie: Movie) => void;
}

export const FeaturedMovie = ({ movie, onBookTickets }: FeaturedMovieProps) => {
  const [imgError, setImgError] = useState(false);

  return (
    <section className="featured-hero" aria-label="Featured Movie">
      <div className="hero-backdrop">
        {!imgError && movie.backdropUrl ? (
          <img
            src={movie.backdropUrl}
            alt={movie.title}
            className="hero-backdrop-img"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="hero-backdrop-fallback" />
        )}
        <div className="hero-overlay" />
      </div>

      <div className="hero-content">
        <div className="hero-tag">🔥 Trending Premiere</div>
        <h1 className="hero-title">{movie.title}</h1>

        <div className="hero-meta">
          <span className="badge badge-rating">⭐ {movie.rating} / 10</span>
          <span className="badge badge-duration">⏱️ {movie.duration}</span>
          <span className="badge badge-lang">🌐 {movie.language}</span>
          <span className="badge badge-year">{movie.releaseYear}</span>
        </div>

        <div className="hero-genres">
          {movie.genre.map((g) => (
            <span key={g} className="genre-pill">
              {g}
            </span>
          ))}
        </div>

        <p className="hero-synopsis">{movie.synopsis}</p>

        <div className="hero-actions">
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={() => onBookTickets(movie)}
          >
            🎟️ Book Tickets
          </button>
          <button
            type="button"
            className="btn btn-outline btn-lg"
            onClick={() =>
              alert(`Watch Trailer preview for "${movie.title}" will be available soon!`)
            }
          >
            ▶ Watch Trailer
          </button>
        </div>
      </div>
    </section>
  );
};
