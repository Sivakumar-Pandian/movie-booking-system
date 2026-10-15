import { useState } from 'react';
import type { Movie } from '../types/movie';

export interface MovieCardProps {
  movie: Movie;
  onBookTickets: (movie: Movie) => void;
  onWatchTrailer: (movie: Movie) => void;
}

export const MovieCard = ({
  movie,
  onBookTickets,
  onWatchTrailer,
}: MovieCardProps) => {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <article className="cinema-card">
      {/* Poster Container with Overlay Badges */}
      <div className="card-poster-box">
        {!imgFailed ? (
          <img
            src={movie.posterUrl}
            alt={`${movie.title} poster`}
            className="card-poster-img"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="card-fallback-poster">
            <span className="fallback-emoji">🎬</span>
            <span className="fallback-name">{movie.title}</span>
            <span className="fallback-lang">{movie.language}</span>
          </div>
        )}

        {/* Top Badges */}
        <div className="card-top-badges">
          <span className="card-format-badge">
            {movie.formats[0] ?? '2D'}
          </span>
          <div className="card-rating-badge" title={`${movie.votes} votes`}>
            <span className="star">★</span>
            <span className="score">{movie.rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Quick trailer hover button */}
        <button
          type="button"
          className="card-quick-trailer-btn"
          onClick={(e) => {
            e.stopPropagation();
            onWatchTrailer(movie);
          }}
          title="Watch Trailer"
        >
          ▶ Trailer
        </button>

        {/* Bottom Banner inside Poster */}
        <div className="card-poster-bottom-bar">
          <span className="cert-pill">{movie.certification}</span>
          <span className="lang-pill">{movie.language}</span>
        </div>
      </div>

      {/* Card Info Content */}
      <div className="card-details">
        <h3 className="card-movie-title" title={movie.title}>
          {movie.title}
        </h3>

        <div className="card-meta-line">
          <span className="card-duration">⏱️ {movie.duration}</span>
          <span className="card-year">{movie.releaseYear}</span>
        </div>

        {/* Genre Tags */}
        <div className="card-genre-wrap">
          {movie.genre.slice(0, 3).map((g) => (
            <span key={g} className="card-genre-badge">
              {g}
            </span>
          ))}
        </div>

        {/* Book Button */}
        <div className="card-actions-wrap">
          <button
            type="button"
            className="btn btn-primary btn-block card-booking-btn"
            onClick={() => onBookTickets(movie)}
          >
            <span>Book Tickets</span>
          </button>
        </div>
      </div>
    </article>
  );
};
