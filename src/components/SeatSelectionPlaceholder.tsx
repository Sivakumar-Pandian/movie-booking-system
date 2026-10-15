import type { BookingSelection } from '../types/booking';

interface SeatSelectionPlaceholderProps {
  booking: BookingSelection;
  onBackToShowtimes: () => void;
  onBackToListing: () => void;
}

export const SeatSelectionPlaceholder = ({
  booking,
  onBackToShowtimes,
  onBackToListing,
}: SeatSelectionPlaceholderProps) => {
  const { movie, date, theater, showtime } = booking;

  // Sample static rows to visually simulate a theater hall
  const sampleRows = ['A', 'B', 'C', 'D', 'E'];

  return (
    <div className="seat-placeholder-view">
      {/* Top Navigation */}
      <div className="seat-nav-header">
        <div className="seat-nav-inner">
          <button
            type="button"
            className="btn btn-secondary back-button"
            onClick={onBackToShowtimes}
          >
            ← Change Showtime / Date
          </button>

          <button
            type="button"
            className="btn btn-outline"
            onClick={onBackToListing}
          >
            ✕ Back to All Movies
          </button>
        </div>
      </div>

      <div className="seat-placeholder-container">
        {/* Confirmed Selection Banner */}
        <section className="booking-confirmed-card" aria-label="Booking Details Summary">
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="booking-poster-thumb"
          />

          <div className="booking-details-col">
            <div className="status-indicator-badge">
              <span className="dot-pulse" />
              <span>Milestone 2 Milestone Achieved: Showtime & Movie Locked</span>
            </div>

            <h1 className="booking-film-title">{movie.title}</h1>

            <div className="booking-meta-badges">
              <span className="badge badge-rating">⭐ {movie.rating}</span>
              <span className="badge">{movie.certification}</span>
              <span className="badge">⏱️ {movie.duration}</span>
              <span className="badge">🗣️ {movie.language}</span>
            </div>

            <div className="booking-summary-strip">
              <div className="summary-item">
                <span className="item-label">Date</span>
                <strong className="item-val">📅 {date.fullDate}</strong>
              </div>
              <div className="summary-divider" />
              <div className="summary-item">
                <span className="item-label">Showtime & Format</span>
                <strong className="item-val">⏰ {showtime.time} • {showtime.format}</strong>
              </div>
              <div className="summary-divider" />
              <div className="summary-item">
                <span className="item-label">Cinema Theater</span>
                <strong className="item-val">📍 {theater.name}</strong>
              </div>
              <div className="summary-divider" />
              <div className="summary-item">
                <span className="item-label">Ticket Base Price</span>
                <strong className="item-val price-highlight">₹{showtime.price} / ticket</strong>
              </div>
            </div>
          </div>
        </section>

        {/* Visual Seat Hall Preview */}
        <section className="seat-hall-preview" aria-label="Seat Selection Hall Preview">
          <div className="screen-curve-wrapper">
            <div className="screen-curve" />
            <span className="screen-text">ALL EYES THIS WAY • CINEMA SCREEN</span>
          </div>

          {/* Seat Grid Placeholder */}
          <div className="seats-hall-matrix">
            {sampleRows.map((row) => (
              <div key={row} className="seat-row-sample">
                <span className="row-letter">{row}</span>
                <div className="row-seats-group">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <div
                      key={num}
                      className={`sample-seat ${num === 5 || num === 6 ? 'seat-reserved' : 'seat-available'}`}
                      title={`Seat ${row}${num}`}
                    >
                      {num}
                    </div>
                  ))}
                </div>
                <span className="row-letter">{row}</span>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="seat-legend-row">
            <div className="legend-item">
              <span className="legend-box seat-available" />
              <span>Available</span>
            </div>
            <div className="legend-item">
              <span className="legend-box seat-reserved" />
              <span>Reserved</span>
            </div>
            <div className="legend-item">
              <span className="legend-box seat-selected" />
              <span>Selected</span>
            </div>
          </div>

          {/* Milestone 2 Scope Banner */}
          <div className="milestone-scope-box">
            <div className="milestone-icon">🎯</div>
            <div className="milestone-content">
              <h3>Milestone 2 Target Completed!</h3>
              <p>
                You have successfully implemented <strong>movie selection, interactive dates, and showtime picks</strong> using React state.
              </p>
              <p className="milestone-next-note">
                Interactive seat clicking, ticket quantity counter, and checkout will be implemented in the next milestone!
              </p>
            </div>
          </div>

          <div className="placeholder-actions">
            <button
              type="button"
              className="btn btn-secondary btn-lg"
              onClick={onBackToShowtimes}
            >
              ← Choose Different Showtime
            </button>
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={onBackToListing}
            >
              Browse More Movies
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
