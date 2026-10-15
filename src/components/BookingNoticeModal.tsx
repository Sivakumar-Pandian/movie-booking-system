import type { Movie } from '../types/movie';

interface BookingNoticeModalProps {
  movie: Movie | null;
  onClose: () => void;
}

export const BookingNoticeModal = ({ movie, onClose }: BookingNoticeModalProps) => {
  if (!movie) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Close dialog"
        >
          ✕
        </button>

        <div className="modal-badge">Milestone 1 Preview</div>
        <h3 className="modal-title">{movie.title}</h3>

        <div className="modal-movie-info">
          <span>⭐ {movie.rating}</span>
          <span>•</span>
          <span>⏱️ {movie.duration}</span>
          <span>•</span>
          <span>🗣️ {movie.language}</span>
          <span>•</span>
          <span>{movie.genre.join(', ')}</span>
        </div>

        <p className="modal-desc">
          You clicked <strong>Book Tickets</strong>! Seat selection, showtimes, and checkout
          will be implemented in future milestones.
        </p>

        <div className="modal-status-box">
          <span className="status-dot"></span>
          <span>Frontend listing active • Ready for Milestone 2</span>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={onClose}
        >
          Got it!
        </button>
      </div>
    </div>
  );
};
