import { useEffect, useState } from 'react';
import type { BookingSelection, BookingConfirmation, PaymentMethod } from '../types/booking';
import type { AuthUser } from '../types/auth';
import { confirmHeldPayment } from '../services/bookingApi';

interface BookingSummaryProps {
  selection: BookingSelection;
  selectedSeats: string[];
  currentUser: AuthUser | null;
  onRequestAuth: () => void;
  onBackToSeats: () => void;
  onPaymentSuccess: (confirmation: BookingConfirmation) => void;
  holdExpiresAt: string | null;
}

export const BookingSummary = ({
  selection,
  selectedSeats,
  currentUser,
  onRequestAuth,
  onBackToSeats,
  onPaymentSuccess,
  holdExpiresAt,
}: BookingSummaryProps) => {
  const { movie, date, theater, showtime } = selection;

  // Derived calculations (Computed on the fly directly from selections)
  const seatCount = selectedSeats.length;
  const pricePerSeat = showtime.price;
  const subtotal = seatCount * pricePerSeat;
  // Sample convenience fee: ₹28 per seat (standard cinema booking fee)
  const convenienceFee = seatCount > 0 ? seatCount * 28 : 0;
  const totalAmount = subtotal + convenienceFee;

  // Mock Payment Form States
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [upiId, setUpiId] = useState('moviegoer@yozigo');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8821');
  const [cardExpiry, setCardExpiry] = useState('08/29');
  const [cardCvv, setCardCvv] = useState('321');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');

  // Simulated Payment Execution States
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [simulationMode, setSimulationMode] = useState<'success' | 'failure'>('success');
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!holdExpiresAt) return;
    const update = () => setSecondsRemaining(Math.max(0, Math.ceil((new Date(holdExpiresAt).getTime() - Date.now()) / 1000)));
    update(); const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [holdExpiresAt]);

  // Validation: Guard against checkout if no seats are selected
  const hasValidSeats = seatCount > 0;

  const handleExecutePayment = async (forcedOutcome?: 'success' | 'failure') => {
    if (!hasValidSeats || isProcessing) return;

    // Check if user is logged in
    if (!currentUser) {
      onRequestAuth();
      return;
    }

    const outcome = forcedOutcome ?? simulationMode;
    setIsProcessing(true);
    setPaymentError(null);

    if (outcome === 'failure') {
      // Simulate gateway failure
      setTimeout(() => {
        setIsProcessing(false);
        setPaymentError(
          'Simulated Payment Declined: Your test transaction could not be processed by the mock bank gateway. Please try again.'
        );
      }, 1000);
      return;
    }

    try {
      // Persist real booking to backend database with atomic double-booking safety
      const savedBooking = await confirmHeldPayment(showtime.id, selectedSeats, paymentMethod);

      const timestamp = new Date(savedBooking.created_at).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });

      setIsProcessing(false);
      onPaymentSuccess({
        bookingRef: savedBooking.booking_ref,
        bookingTimestamp: timestamp,
        selection,
        selectedSeats,
        pricePerSeat,
        subtotal,
        convenienceFee,
        totalAmount,
        paymentMethod,
      });
    } catch (err: unknown) {
      setIsProcessing(false);
      if (err instanceof Error) {
        setPaymentError(err.message);
      } else {
        setPaymentError('An error occurred during booking. Please try again.');
      }
    }
  };

  return (
    <div className="summary-view-container">
      {/* Top Nav */}
      <div className="summary-topbar">
        <div className="summary-topbar-inner">
          <button
            type="button"
            className="btn btn-secondary back-button"
            onClick={onBackToSeats}
            disabled={isProcessing}
          >
            ← Back to Seats ({seatCount})
          </button>
          <span className="summary-page-title">Booking Summary & Payment</span>
        </div>
      </div>

      <div className="summary-main-wrapper">
        {/* Guard warning if no seats are selected */}
        {!hasValidSeats && (
          <div className="empty-seats-alert" role="alert">
            <span className="alert-icon">⚠️</span>
            <div>
              <strong>No Seats Selected:</strong> You cannot proceed to payment without selecting at least one seat.
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={onBackToSeats}
            >
              Select Seats Now
            </button>
          </div>
        )}

        <div className="summary-card-container">
          {secondsRemaining !== null && <p className="seat-selection-limit" role="status">Seats held for {Math.floor(secondsRemaining / 60)}:{String(secondsRemaining % 60).padStart(2, '0')}</p>}
          {/* Header Ticket Strip */}
          <div className="ticket-header-strip">
            <span className="ticket-icon">🎟️</span>
            <div>
              <span className="ticket-badge">CHECKOUT REVIEW</span>
              <h1 className="ticket-movie-title">{movie.title}</h1>
            </div>
          </div>

          <div className="ticket-body-grid">
            {/* Left Col: Movie, Theater & Seat Details */}
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
                  <span className="meta-label">Show Date & Time</span>
                  <strong className="meta-val">📅 {date.fullDate}</strong>
                  <span className="meta-sub">⏰ {showtime.time} • Format: {showtime.format}</span>
                </div>

                {/* Selected Seats Chips */}
                <div className="ticket-seats-box">
                  <span className="meta-label">Selected Seats ({seatCount})</span>
                  {hasValidSeats ? (
                    <div className="confirmed-seat-chips">
                      {selectedSeats.map((seatId) => (
                        <span key={seatId} className="confirmed-seat-pill">
                          {seatId}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="no-seats-text">None selected</span>
                  )}
                </div>
              </div>
            </div>

            {/* Right Col: Price Breakdown & Simulated Payment */}
            <div className="ticket-receipt-col">
              {/* Price Calculation (Strictly Derived) */}
              <div className="receipt-breakdown-box">
                <h3 className="breakdown-title">Fare Breakdown</h3>

                <div className="breakdown-row">
                  <span>Tickets ({seatCount} × ₹{pricePerSeat})</span>
                  <span>₹{subtotal}</span>
                </div>

                <div className="breakdown-row">
                  <span>Sample Convenience Fee (₹28/ticket)</span>
                  <span>₹{convenienceFee}</span>
                </div>

                <div className="breakdown-divider" />

                <div className="breakdown-row total-row">
                  <strong>Total Amount Payable</strong>
                  <strong className="final-price-text">₹{totalAmount}</strong>
                </div>
              </div>

              {/* SIMULATED PAYMENT FORM */}
              <div className="mock-payment-section">
                <div className="mock-payment-header">
                  <h3 className="payment-title">Simulated Payment Gateway</h3>
                  <span className="sandbox-badge">TEST SANDBOX • NO REAL MONEY</span>
                </div>

                <p className="mock-disclaimer-note">
                  🔒 This is a simulated frontend demo for Milestone 4. No real bank accounts or credit cards will be charged.
                </p>

                {/* Payment Method Tabs */}
                <div className="payment-methods-tabs" role="tablist" aria-label="Mock Payment Methods">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={paymentMethod === 'upi'}
                    className={`pay-tab-btn ${paymentMethod === 'upi' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('upi')}
                    disabled={isProcessing}
                  >
                    ⚡ UPI / QR
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={paymentMethod === 'card'}
                    className={`pay-tab-btn ${paymentMethod === 'card' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('card')}
                    disabled={isProcessing}
                  >
                    💳 Card
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={paymentMethod === 'netbanking'}
                    className={`pay-tab-btn ${paymentMethod === 'netbanking' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('netbanking')}
                    disabled={isProcessing}
                  >
                    🏦 NetBanking
                  </button>
                </div>

                {/* Method Form Inputs */}
                <div className="mock-input-container">
                  {paymentMethod === 'upi' && (
                    <div className="mock-field-group">
                      <label className="field-label" htmlFor="mock-upi-input">Mock UPI ID / VPA</label>
                      <input
                        id="mock-upi-input"
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="mock-text-input"
                        placeholder="username@okhdfcbank"
                        disabled={isProcessing}
                      />
                      <span className="field-helper">Sample mock address automatically populated</span>
                    </div>
                  )}

                  {paymentMethod === 'card' && (
                    <div className="mock-card-fields">
                      <div className="mock-field-group">
                        <label className="field-label" htmlFor="mock-card-num">Card Number (Simulated)</label>
                        <input
                          id="mock-card-num"
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="mock-text-input"
                          disabled={isProcessing}
                        />
                      </div>
                      <div className="card-dual-row">
                        <div className="mock-field-group">
                          <label className="field-label" htmlFor="mock-expiry">Expiry</label>
                          <input
                            id="mock-expiry"
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className="mock-text-input"
                            disabled={isProcessing}
                          />
                        </div>
                        <div className="mock-field-group">
                          <label className="field-label" htmlFor="mock-cvv">CVV</label>
                          <input
                            id="mock-cvv"
                            type="password"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            className="mock-text-input"
                            maxLength={3}
                            disabled={isProcessing}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'netbanking' && (
                    <div className="mock-field-group">
                      <label className="field-label" htmlFor="mock-bank-select">Select Bank</label>
                      <select
                        id="mock-bank-select"
                        value={selectedBank}
                        onChange={(e) => setSelectedBank(e.target.value)}
                        className="mock-select-input"
                        disabled={isProcessing}
                      >
                        <option value="HDFC Bank">HDFC Bank</option>
                        <option value="State Bank of India">State Bank of India</option>
                        <option value="ICICI Bank">ICICI Bank</option>
                        <option value="Axis Bank">Axis Bank</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Simulation Mode Toggle (For Testing Success vs Failure) */}
                <div className="simulation-mode-selector">
                  <span className="sim-mode-title">Test Simulation Outcome:</span>
                  <div className="sim-radio-options">
                    <label className={`sim-radio-label ${simulationMode === 'success' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="simOutcome"
                        value="success"
                        checked={simulationMode === 'success'}
                        onChange={() => {
                          setSimulationMode('success');
                          setPaymentError(null);
                        }}
                        disabled={isProcessing}
                      />
                      <span>✅ Simulate Success</span>
                    </label>

                    <label className={`sim-radio-label ${simulationMode === 'failure' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="simOutcome"
                        value="failure"
                        checked={simulationMode === 'failure'}
                        onChange={() => setSimulationMode('failure')}
                        disabled={isProcessing}
                      />
                      <span>❌ Simulate Failure</span>
                    </label>
                  </div>
                </div>

                {/* Error Banner on Simulated Failure */}
                {paymentError && (
                  <div className="payment-error-alert" role="alert">
                    <div className="error-icon">✕</div>
                    <div className="error-content">
                      <strong>Payment Failed:</strong>
                      <p>{paymentError}</p>
                    </div>
                  </div>
                )}

                {/* Payment Submit Buttons */}
                <div className="payment-actions-row">
                  <button
                    type="button"
                    disabled={!hasValidSeats || isProcessing}
                    className="btn btn-primary btn-lg pay-submit-btn"
                    onClick={() => handleExecutePayment()}
                  >
                    {isProcessing ? (
                      <>
                        <span className="loading-spinner" />
                        <span>Processing Secure Payment...</span>
                      </>
                    ) : (
                      <span>
                        {simulationMode === 'success' ? '🔒 Pay & Confirm' : '⚠️ Test Simulated Failure'} (₹{totalAmount})
                      </span>
                    )}
                  </button>

                  {/* Immediate Shortcut Buttons to directly test success or failure */}
                  <div className="test-action-buttons">
                    <button
                      type="button"
                      disabled={!hasValidSeats || isProcessing}
                      className="btn btn-outline test-btn test-success-btn"
                      onClick={() => handleExecutePayment('success')}
                      title="Directly test simulated success outcome"
                    >
                      ✓ Quick Test: Success
                    </button>
                    <button
                      type="button"
                      disabled={!hasValidSeats || isProcessing}
                      className="btn btn-outline test-btn test-fail-btn"
                      onClick={() => handleExecutePayment('failure')}
                      title="Directly test simulated decline outcome"
                    >
                      ✕ Quick Test: Fail
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
