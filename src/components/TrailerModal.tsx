import type { Movie } from '../types/movie';

interface TrailerModalProps {
  movie: Movie | null;
  onClose: () => void;
  onBookTickets: (movie: Movie) => void;
}

export const TrailerModal = ({ movie, onClose, onBookTickets }: TrailerModalProps) => {
  if (!movie) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Movie Trailer">
      <div className="trailer-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="trailer-header">
          <div className="trailer-title-wrap">
            <span className="trailer-badge">OFFICIAL TEASER</span>
            <h3 className="trailer-title">{movie.title}</h3>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close trailer dialog"
          >
            ✕
          </button>
        </div>

        {/* Video Player or Simulated Cinema Screen */}
        <div className="trailer-video-container">
          {movie.trailerYoutubeId ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${movie.trailerYoutubeId}?autoplay=1&mute=0&rel=0`}
              title={`${movie.title} Trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="trailer-iframe"
            />
          ) : (
            <div className="trailer-fallback-screen">
              {movie.backdropUrl && (
                <img
                  src={movie.backdropUrl}
                  alt={movie.title}
                  className="trailer-fallback-bg"
                />
              )}
              <div className="trailer-fallback-overlay">
                <span className="trailer-play-pulse">▶</span>
                <p>Cinema Teaser Reel Playing</p>
                <span className="trailer-sound-tag">Dolby 7.1 Surround Preview</span>
              </div>
            </div>
          )}
        </div>

        {/* Trailer metadata footer */}
        <div className="trailer-footer">
          <div className="trailer-meta-left">
            <div className="trailer-badges">
              <span className="badge badge-rating">⭐ {movie.rating} ({movie.votes})</span>
              <span className="badge">{movie.certification}</span>
              <span className="badge">⏱️ {movie.duration}</span>
              <span className="badge">🗣️ {movie.language}</span>
            </div>
            {movie.cast && movie.cast.length > 0 && (
              <p className="trailer-cast">
                <strong>Starring:</strong> {movie.cast.join(', ')}
              </p>
            )}
          </div>

          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={() => {
              onClose();
              onBookTickets(movie);
            }}
          >
            🎟️ Book Tickets Now
          </button>
        </div>
      </div>
    </div>
  );
};
