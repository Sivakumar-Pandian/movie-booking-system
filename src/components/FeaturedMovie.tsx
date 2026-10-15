import { useState } from 'react';
import type { Movie } from '../types/movie';

interface FeaturedMovieProps {
  featuredMovies: Movie[];
  activeMovie: Movie;
  onSelectMovie: (movie: Movie) => void;
  onBookTickets: (movie: Movie) => void;
  onWatchTrailer: (movie: Movie) => void;
}

export const FeaturedMovie = ({
  featuredMovies,
  activeMovie,
  onSelectMovie,
  onBookTickets,
  onWatchTrailer,
}: FeaturedMovieProps) => {
  const [imgError, setImgError] = useState(false);

  return (
    <section className="featured-hero" aria-label="Featured Premiere">
      {/* Cinematic Backdrop with Vignette */}
      <div className="hero-backdrop">
        {!imgError && activeMovie.backdropUrl ? (
          <img
            key={activeMovie.id}
            src={activeMovie.backdropUrl}
            alt={activeMovie.title}
            className="hero-backdrop-img"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="hero-backdrop-fallback" />
        )}
        <div className="hero-vignette-bottom" />
        <div className="hero-vignette-left" />
      </div>

      <div className="hero-inner-container">
        <div className="hero-content">
          {/* Top Marquee Badges */}
          <div className="hero-badge-row">
            <span className="hero-badge-special">🔥 BLOCKBUSTER OF THE WEEK</span>
            <span className="hero-badge-format">{activeMovie.formats[0] ?? 'IMAX'}</span>
          </div>

          <h1 className="hero-title">{activeMovie.title}</h1>

          {/* Rating, Certification, Duration */}
          <div className="hero-meta-strip">
            <div className="hero-rating-pill">
              <span className="star-icon">★</span>
              <span className="rating-score">{activeMovie.rating}</span>
              <span className="rating-votes">/ 10 ({activeMovie.votes})</span>
            </div>
            <span className="hero-meta-dot">•</span>
            <span className="hero-meta-pill">{activeMovie.certification}</span>
            <span className="hero-meta-dot">•</span>
            <span className="hero-meta-pill">⏱️ {activeMovie.duration}</span>
            <span className="hero-meta-dot">•</span>
            <span className="hero-meta-pill">🗣️ {activeMovie.language}</span>
          </div>

          {/* Genres */}
          <div className="hero-genre-tags">
            {activeMovie.genre.map((g) => (
              <span key={g} className="hero-genre-pill">
                {g}
              </span>
            ))}
          </div>

          {/* Synopsis */}
          <p className="hero-synopsis">{activeMovie.synopsis}</p>

          {/* Director & Cast snippet */}
          {activeMovie.cast && (
            <div className="hero-cast-strip">
              <span className="cast-label">Starring:</span>
              <span className="cast-names">{activeMovie.cast.join(', ')}</span>
            </div>
          )}

          {/* CTAs */}
          <div className="hero-action-buttons">
            <button
              type="button"
              className="btn btn-primary btn-hero"
              onClick={() => onBookTickets(activeMovie)}
            >
              <span className="btn-icon">🎟️</span>
              <span>Book Tickets</span>
            </button>
            <button
              type="button"
              className="btn btn-outline btn-hero"
              onClick={() => onWatchTrailer(activeMovie)}
            >
              <span className="btn-icon">▶</span>
              <span>Watch Trailer</span>
            </button>
          </div>
        </div>

        {/* Carousel Quick Switcher Thumbnails */}
        {featuredMovies.length > 1 && (
          <div className="hero-carousel-selector" aria-label="Featured Blockbusters Carousel">
            <span className="selector-title">Trending Highlights</span>
            <div className="selector-cards-row">
              {featuredMovies.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`selector-thumb-card ${activeMovie.id === m.id ? 'active' : ''}`}
                  onClick={() => onSelectMovie(m)}
                >
                  <img src={m.posterUrl} alt={m.title} className="thumb-poster" />
                  <div className="thumb-info">
                    <span className="thumb-title">{m.title}</span>
                    <span className="thumb-rating">⭐ {m.rating}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
