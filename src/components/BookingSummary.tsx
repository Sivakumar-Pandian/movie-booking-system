import type { ConfirmedBooking } from '../types/booking';

interface BookingSummaryProps {
  confirmedBooking: ConfirmedBooking;
  onBackToSeats: () => void;
  onBackToListing: () => void;
}

export const BookingSummary = ({
  confirmedBooking,
  onBackToSeats,
  onBackToListing,
}: BookingSummaryProps) => {
  const { selection, selectedSeats, pricePerSeat, totalPrice } = confirmedBooking;
  const { movie, date, theater, showtime } = selection;

  const bookingFee = Math.round(selectedSeats.length * 28);
  const grandTotal = totalPrice + bookingFee;

  return (
    <div className="summary-view-container">
      {/* Top Nav */}
      <div className="summary-topbar">
        <div className="summary-topbar-inner">
          <button
            type="button"
            className="btn btn-secondary back-button"
            onClick={onBackToSeats}
          >
            ← Change Selected Seats
          </button>
          <span className="summary-page-title">Booking Order Summary</span>
        </div>
      </div>

      <div className="summary-main-wrapper">
        <div className="summary-card-container">
          {/* Header Ticket Strip */}
          <div className="ticket-header-strip">
            <span className="ticket-icon">🎟️</span>
            <div>
              <span className="ticket-badge">E-TICKET PREVIEW</span>
              <h1 className="ticket-movie-title">{movie.title}</h1>
            </div>
          </div>

          <div className="ticket-body-grid">
            {/* Left Col: Poster & Cinema Meta */}
            <div className="ticket-meta-col">
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="ticket-poster-img"
              />
              <div className="ticket-meta-details">
                <div className="meta-badge-row">
                  <span className="badge">{movie.certification}</span>
                  <span className="badge">⏱️ {movie.duration}</span>
                  <span className="badge">🗣️ {movie.language}</span>
                </div>
                <div className="ticket-theater-box">
                  <span className="meta-label">Cinema Theater</span>
                  <strong className="meta-val">📍 {theater.name}</strong>
                  <span className="meta-sub">{theater.location}</span>
                </div>
                <div className="ticket-datetime-box">
                  <span className="meta-label">Date & Time</span>
                  <strong className="meta-val">📅 {date.fullDate}</strong>
                  <span className="meta-sub">⏰ {showtime.time} ({showtime.format})</span>
                </div>
              </div>
            </div>

            {/* Right Col: Seats & Invoice Breakdown */}
            <div className="ticket-receipt-col">
              {/* Selected Seats Banner */}
              <div className="confirmed-seats-box">
                <span className="seats-box-title">Selected Seats ({selectedSeats.length})</span>
                <div className="confirmed-seat-chips">
                  {selectedSeats.map((seatId) => (
                    <span key={seatId} className="confirmed-seat-pill">
                      {seatId}
                    </span>
                  ))}
                </div>
              </div>

              {/* Price Breakdown Calculation */}
              <div className="receipt-breakdown-box">
                <h3 className="breakdown-title">Payment Summary</h3>

                <div className="breakdown-row">
                  <span>Tickets ({selectedSeats.length} × ₹{pricePerSeat})</span>
                  <span>₹{totalPrice}</span>
                </div>

                <div className="breakdown-row">
                  <span>Convenience Fee & Taxes</span>
                  <span>₹{bookingFee}</span>
                </div>

                <div className="breakdown-divider" />

                <div className="breakdown-row total-row">
                  <strong>Total Amount Payable</strong>
                  <strong className="final-price-text">₹{grandTotal}</strong>
                </div>
              </div>

              {/* Milestone 3 Completion Notice */}
              <div className="milestone-done-card">
                <span className="milestone-star">⭐</span>
                <div>
                  <h4>Milestone 3 Successfully Completed!</h4>
                  <p>
                    Your selected movie, showtime, and interactive seats (<strong>{selectedSeats.join(', ')}</strong>)
                    are securely tracked in React state and dynamically calculated.
                  </p>
                  <p className="milestone-next-preview">
                    Payment Gateway & Confirmation Tickets will be built in Milestone 4.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="summary-actions-row">
                <button
                  type="button"
                  className="btn btn-secondary btn-lg"
                  onClick={onBackToSeats}
                >
                  ← Edit Seats
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={onBackToListing}
                >
                  Browse More Movies
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
