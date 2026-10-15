import type { BookingSelection } from '../types/booking';
import { INITIAL_SEAT_LAYOUT } from '../data/seats';

interface SeatSelectionProps {
  booking: BookingSelection;
  selectedSeats: string[];
  onToggleSeat: (seatId: string) => void;
  onBackToShowtimes: () => void;
  onProceedToSummary: () => void;
}

export const SeatSelection = ({
  booking,
  selectedSeats,
  onToggleSeat,
  onBackToShowtimes,
  onProceedToSummary,
}: SeatSelectionProps) => {
  const { movie, date, theater, showtime } = booking;

  // Derived Values calculated directly from props:
  const seatCount = selectedSeats.length;
  const pricePerSeat = showtime.price;
  const totalPrice = seatCount * pricePerSeat;

  // Guard: Proceed only if at least one seat is selected
  const handleContinue = () => {
    if (seatCount === 0) return;
    onProceedToSummary();
  };

  return (
    <div className="seat-selection-view">
      {/* Top Breadcrumb Navigation */}
      <div className="seat-selection-topbar">
        <div className="seat-topbar-inner">
          <button
            type="button"
            className="btn btn-secondary back-button"
            onClick={onBackToShowtimes}
          >
            ← Back to Showtimes
          </button>

          <div className="seat-screen-info">
            <span className="movie-tag">🎬 {movie.title}</span>
            <span className="theater-tag">📍 {theater.name}</span>
            <span className="time-tag">⏰ {date.label} ({date.day} {date.month}), {showtime.time}</span>
          </div>
        </div>
      </div>

      <div className="seat-main-content">
        {/* Cinema Screen Banner */}
        <div className="cinema-screen-container">
          <div className="cinema-screen-glow" />
          <div className="cinema-screen-curved-line" />
          <p className="screen-caption">SCREEN THIS WAY (EYES FRONT)</p>
        </div>

        {/* Legend Indicator */}
        <div className="seat-legend-box" role="status" aria-label="Seat Legend">
          <div className="legend-entry">
            <span className="legend-swatch swatch-available" />
            <span>Available</span>
          </div>
          <div className="legend-entry">
            <span className="legend-swatch swatch-selected" />
            <span>Selected</span>
          </div>
          <div className="legend-entry">
            <span className="legend-swatch swatch-unavailable" />
            <span>Unavailable / Booked</span>
          </div>
        </div>

        {/* Interactive Seating Matrix */}
        <section className="seating-matrix-section" aria-label="Theater Seating Map">
          <div className="seats-grid-table">
            {INITIAL_SEAT_LAYOUT.map((seatRow) => (
              <div key={seatRow.row} className="seating-row">
                {/* Left Row Label */}
                <span className="row-label">{seatRow.row}</span>

                {/* Left Wing Seats (Seats 1 to 5) */}
                <div className="seat-wing left-wing">
                  {seatRow.seats.slice(0, 5).map((seat) => {
                    const isSelected = selectedSeats.includes(seat.id);
                    const seatStatusClass = seat.isUnavailable
                      ? 'seat-unavailable'
                      : isSelected
                      ? 'seat-selected'
                      : 'seat-available';

                    return (
                      <button
                        key={seat.id}
                        type="button"
                        disabled={seat.isUnavailable}
                        aria-pressed={isSelected}
                        aria-label={`Seat ${seat.id}, ${seat.isUnavailable ? 'Unavailable' : isSelected ? 'Selected' : 'Available'}`}
                        className={`interactive-seat-btn ${seatStatusClass}`}
                        onClick={() => {
                          if (!seat.isUnavailable) {
                            onToggleSeat(seat.id);
                          }
                        }}
                      >
                        <span className="seat-id-label">{seat.number}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Center Aisle Gap */}
                <div className="center-aisle-divider" aria-hidden="true">
                  <span className="aisle-marker">AISLE</span>
                </div>

                {/* Right Wing Seats (Seats 6 to 10) */}
                <div className="seat-wing right-wing">
                  {seatRow.seats.slice(5, 10).map((seat) => {
                    const isSelected = selectedSeats.includes(seat.id);
                    const seatStatusClass = seat.isUnavailable
                      ? 'seat-unavailable'
                      : isSelected
                      ? 'seat-selected'
                      : 'seat-available';

                    return (
                      <button
                        key={seat.id}
                        type="button"
                        disabled={seat.isUnavailable}
                        aria-pressed={isSelected}
                        aria-label={`Seat ${seat.id}, ${seat.isUnavailable ? 'Unavailable' : isSelected ? 'Selected' : 'Available'}`}
                        className={`interactive-seat-btn ${seatStatusClass}`}
                        onClick={() => {
                          if (!seat.isUnavailable) {
                            onToggleSeat(seat.id);
                          }
                        }}
                      >
                        <span className="seat-id-label">{seat.number}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Right Row Label */}
                <span className="row-label">{seatRow.row}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Milestone Note */}
        <p className="seat-disclaimer-note">
          * Note: Unavailable seats are sample frontend data. Real seat persistence will connect with the backend in future milestones.
        </p>
      </div>

      {/* Floating Bottom Sticky Bar showing Seats & Dynamic Total */}
      <aside className="sticky-seat-summary-bar" aria-label="Seat Selection Summary">
        <div className="sticky-seat-inner">
          <div className="seat-details-summary">
            {seatCount > 0 ? (
              <>
                <div className="selected-seats-chip-group">
                  <span className="seats-count-badge">
                    {seatCount} {seatCount === 1 ? 'Seat' : 'Seats'} Selected:
                  </span>
                  <div className="seat-id-chips">
                    {selectedSeats.map((id) => (
                      <span key={id} className="seat-chip">
                        {id}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="seat-price-breakdown">
                  ₹{pricePerSeat} × {seatCount} {seatCount === 1 ? 'seat' : 'seats'}
                </span>
              </>
            ) : (
              <div className="empty-seat-instruction">
                <span className="instruction-icon">👉</span>
                <span>Please click on any available seat in the map above to select your seats</span>
              </div>
            )}
          </div>

          <div className="seat-summary-actions">
            <div className="seat-total-box">
              <span className="total-label">Total Amount</span>
              <span className="total-value">₹{totalPrice}</span>
            </div>

            <button
              type="button"
              disabled={seatCount === 0}
              className="btn btn-primary btn-lg continue-seats-btn"
              onClick={handleContinue}
            >
              <span>Continue ({seatCount}) →</span>
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};
