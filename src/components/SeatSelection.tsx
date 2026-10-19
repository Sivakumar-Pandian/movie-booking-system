import { useState, useEffect } from 'react';
import type { BookingSelection } from '../types/booking';
import { INITIAL_SEAT_LAYOUT } from '../data/seats';
import { createSeatHold, fetchSeatAvailability } from '../services/bookingApi';
import type { AuthUser } from '../types/auth';

interface SeatSelectionProps {
  booking: BookingSelection;
  selectedSeats: string[];
  onToggleSeat: (seatId: string) => void;
  onBackToShowtimes: () => void;
  onProceedToSummary: () => void;
  currentUser: AuthUser | null;
  onRequestAuth: () => void;
  onHoldCreated: (expiresAt: string) => void;
}

export const SeatSelection = ({
  booking,
  selectedSeats,
  onToggleSeat,
  onBackToShowtimes,
  onProceedToSummary,
  currentUser,
  onRequestAuth,
  onHoldCreated,
}: SeatSelectionProps) => {
  const { movie, date, theater, showtime } = booking;
  const [liveBookedSeats, setLiveBookedSeats] = useState<string[]>([]);
  const [liveHeldSeats, setLiveHeldSeats] = useState<string[]>([]);
  const [loadingLiveSeats, setLoadingLiveSeats] = useState<boolean>(true);
  const [holdError, setHoldError] = useState<string | null>(null);
  const [isHolding, setIsHolding] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  // Fetch live confirmed booked seats from backend database
  useEffect(() => {
    let isCurrent = true;
    setLoadingLiveSeats(true);
    const refresh = () => fetchSeatAvailability(showtime.id)
      .then((booked) => {
        if (isCurrent) {
          setLiveBookedSeats(booked.booked);
          setLiveHeldSeats(booked.held);
          setLoadingLiveSeats(false);
        }
      })
      .catch(() => {
        if (isCurrent) setLoadingLiveSeats(false);
      });
    refresh();
    const polling = window.setInterval(refresh, 5000);
    return () => {
      isCurrent = false;
      window.clearInterval(polling);
    };
  }, [showtime.id]);

  // Derived Values calculated directly from props:
  const seatCount = selectedSeats.length;
  const pricePerSeat = showtime.price;
  const totalPrice = seatCount * pricePerSeat;

  // Guard: Proceed only if at least one seat is selected
  const handleContinue = () => {
    if (seatCount === 0) return;
    if (!currentUser) { onRequestAuth(); return; }
    setIsHolding(true); setHoldError(null);
    createSeatHold(showtime.id, selectedSeats).then((hold) => {
      setSecondsLeft(Math.max(0, Math.ceil((new Date(hold.expires_at).getTime() - Date.now()) / 1000)));
      onHoldCreated(hold.expires_at);
      onProceedToSummary();
    }).catch((error: unknown) => setHoldError(error instanceof Error ? error.message : 'Unable to hold seats.'))
      .finally(() => setIsHolding(false));
  };

  useEffect(() => {
    if (secondsLeft === null) return;
    const timer = window.setInterval(() => setSecondsLeft((value) => value === null ? null : Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [secondsLeft !== null]);

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
          <div className="legend-entry live-sync-indicator">
            <span className="live-dot" />
            <span>{loadingLiveSeats ? 'Syncing Seats...' : '⚡ Real-time DB Synced'}</span>
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
                    const isBooked = seat.isUnavailable || liveBookedSeats.includes(seat.id) || liveHeldSeats.includes(seat.id);
                    const isSelected = selectedSeats.includes(seat.id);
                    const seatStatusClass = isBooked
                      ? 'seat-unavailable'
                      : isSelected
                      ? 'seat-selected'
                      : 'seat-available';

                    return (
                      <button
                        key={seat.id}
                        type="button"
                        disabled={isBooked}
                        aria-pressed={isSelected}
                        aria-label={`Seat ${seat.id}, ${liveHeldSeats.includes(seat.id) ? 'Held' : isBooked ? 'Booked' : isSelected ? 'Selected' : 'Available'}`}
                        className={`interactive-seat-btn ${seatStatusClass}`}
                        onClick={() => {
                          if (!isBooked) {
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
                    const isBooked = seat.isUnavailable || liveBookedSeats.includes(seat.id) || liveHeldSeats.includes(seat.id);
                    const isSelected = selectedSeats.includes(seat.id);
                    const seatStatusClass = isBooked
                      ? 'seat-unavailable'
                      : isSelected
                      ? 'seat-selected'
                      : 'seat-available';

                    return (
                      <button
                        key={seat.id}
                        type="button"
                        disabled={isBooked}
                        aria-pressed={isSelected}
                        aria-label={`Seat ${seat.id}, ${isBooked ? 'Unavailable' : isSelected ? 'Selected' : 'Available'}`}
                        className={`interactive-seat-btn ${seatStatusClass}`}
                        onClick={() => {
                          if (!isBooked) {
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
          Seat availability refreshes automatically every 5 seconds.
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
              disabled={seatCount === 0 || isHolding}
              className="btn btn-primary btn-lg continue-seats-btn"
              onClick={handleContinue}
            >
              <span>{isHolding ? 'Holding seats...' : `Continue (${seatCount}) →`}</span>
            </button>
          </div>
        </div>
      </aside>
      {holdError && <p className="seat-selection-limit" role="alert">{holdError}</p>}
      {secondsLeft !== null && <p className="seat-selection-limit">Seat hold: {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}</p>}
    </div>
  );
};
