import type { BookingConfirmation } from '../types/booking';

interface BookingConfirmationViewProps {
  confirmation: BookingConfirmation;
  onBookAnother: () => void;
}

export const BookingConfirmationView = ({
  confirmation,
  onBookAnother,
}: BookingConfirmationViewProps) => {
  const {
    bookingRef,
    bookingTimestamp,
    selection,
    selectedSeats,
    totalAmount,
    paymentMethod,
  } = confirmation;
  const { movie, date, theater, showtime } = selection;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="confirmation-page-container">
      <div className="confirmation-card-wrapper">
        {/* Success Banner */}
        <div className="confirmation-success-banner">
          <div className="success-icon-badge">✓</div>
          <span className="success-tag">BOOKING SIMULATED SUCCESSFULLY</span>
          <h1 className="success-title">Your Tickets Are Confirmed!</h1>
          <p className="success-subtitle">
            A confirmation notification has been simulated for your booking reference <strong>{bookingRef}</strong>.
          </p>
        </div>

        {/* Digital Cinema Ticket Card */}
        <div className="digital-ticket-card">
          {/* Ticket Header */}
          <div className="ticket-top-brand">
            <div className="ticket-brand-logo">
              <span className="brand-logo-icon">🎟️</span>
              <span className="ticket-brand-text">YOZIGO CINEMAS PASS</span>
            </div>
            <div className="ticket-ref-box">
              <span className="ref-title">BOOKING ID</span>
              <strong className="ref-code">{bookingRef}</strong>
            </div>
          </div>

          <div className="ticket-content-split">
            {/* Left Movie Info */}
            <div className="ticket-main-info">
              <div className="ticket-movie-header">
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="ticket-film-poster"
                />
                <div>
                  <h2 className="ticket-film-title">{movie.title}</h2>
                  <div className="ticket-film-badges">
                    <span className="badge">{movie.certification}</span>
                    <span className="badge">⏱️ {movie.duration}</span>
                    <span className="badge">🗣️ {movie.language}</span>
                    <span className="badge format-badge">{showtime.format}</span>
                  </div>
                </div>
              </div>

              {/* Grid of Cinema Details */}
              <div className="ticket-details-matrix">
                <div className="detail-item">
                  <span className="detail-label">Cinema Theater</span>
                  <strong className="detail-value">{theater.name}</strong>
                  <span className="detail-sub">{theater.location}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Show Date</span>
                  <strong className="detail-value">{date.fullDate}</strong>
                  <span className="detail-sub">{date.label}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Showtime</span>
                  <strong className="detail-value">{showtime.time}</strong>
                  <span className="detail-sub">Audi Screen 3 • {showtime.format}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Confirmed Seats ({selectedSeats.length})</span>
                  <div className="confirmed-seat-chips">
                    {selectedSeats.map((seatId) => (
                      <span key={seatId} className="confirmed-seat-pill">
                        {seatId}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Perforated Stub with QR Code */}
            <div className="ticket-stub-section">
              <div className="perforated-notch top-notch" />
              <div className="perforated-notch bottom-notch" />

              <div className="stub-inner">
                {/* Simulated QR Code */}
                <div className="qr-code-box" title="Scan at cinema entrance">
                  <div className="qr-simulated-pattern">
                    <div className="qr-corner top-left" />
                    <div className="qr-corner top-right" />
                    <div className="qr-corner bottom-left" />
                    <div className="qr-dots-grid" />
                  </div>
                  <span className="qr-caption">SCAN AT GATE</span>
                </div>

                <div className="stub-payment-info">
                  <span className="stub-label">Total Amount Paid</span>
                  <strong className="stub-price">₹{totalAmount}</strong>
                  <span className="stub-method">Paid via Mock {paymentMethod.toUpperCase()}</span>
                  <span className="stub-time">{bookingTimestamp}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Footer Security Stripe */}
          <div className="ticket-bottom-security">
            <span className="security-icon">🔒</span>
            <span>M-Ticket Verification Verified • Contactless Entry Authorized</span>
          </div>
        </div>

        {/* Milestone 4 Clarification Notice */}
        <div className="milestone-demo-notice">
          <div className="notice-icon">💡</div>
          <div className="notice-content">
            <h4>Milestone 4 Demo Status</h4>
            <p>
              This transaction was processed in a <strong>mock frontend sandbox</strong>.
              No real financial transaction took place and no real database booking was saved.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="confirmation-action-buttons">
          <button
            type="button"
            className="btn btn-secondary btn-lg"
            onClick={handlePrint}
          >
            🖨️ Print Ticket / Receipt
          </button>
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={onBookAnother}
          >
            🎬 Book Another Movie
          </button>
        </div>
      </div>
    </div>
  );
};
