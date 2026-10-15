import { useState } from 'react';
import type { Movie } from '../types/movie';

export interface MovieCardProps {
  movie: Movie;
  onBookTickets: (movie: Movie) => void;
}

export const MovieCard = ({ movie, onBookTickets }: MovieCardProps) => {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <article className="movie-card">
      <div className="card-poster-wrapper">
        {!imgFailed ? (
          <img
            src={movie.posterUrl}
            alt={`${movie.title} poster`}
            className="card-poster"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="card-poster-fallback">
            <span className="fallback-icon">🎬</span>
            <span className="fallback-title">{movie.title}</span>
            <span className="fallback-badge">{movie.language}</span>
          </div>
        )}

        <div className="card-rating-badge">
          ⭐ {movie.rating.toFixed(1)}
        </div>
      </div>

      <div className="card-content">
        <h3 className="card-title" title={movie.title}>
          {movie.title}
        </h3>

        <div className="card-meta">
          <span className="card-duration">⏱️ {movie.duration}</span>
          <span className="card-language">🗣️ {movie.language}</span>
        </div>

        <div className="card-genres">
          {movie.genre.map((g) => (
            <span key={g} className="card-genre-tag">
              {g}
            </span>
          ))}
        </div>

        <button
          type="button"
          className="btn btn-primary btn-block card-book-btn"
          onClick={() => onBookTickets(movie)}
        >
          Book Tickets
        </button>
      </div>
    </article>
  );
};
