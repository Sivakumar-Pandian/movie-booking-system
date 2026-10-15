import { useEffect, useState } from 'react';
import type { ApiBookingRecord } from '../services/bookingApi';
import { fetchUserBookings } from '../services/bookingApi';
import type { AuthUser } from '../types/auth';

interface MyBookingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
}

export const MyBookingsModal = ({
  isOpen,
  onClose,
  currentUser,
}: MyBookingsModalProps) => {
  const [bookings, setBookings] = useState<ApiBookingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBookings = async () => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUserBookings();
      setBookings(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to fetch booking history');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && currentUser) {
      loadBookings();
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  return (
    <div className="bookings-modal-overlay" role="dialog" aria-modal="true">
      <div className="bookings-modal-card">
        <div className="bookings-modal-header">
          <div>
            <span className="bookings-badge">ACCOUNT DASHBOARD</span>
            <h2 className="bookings-title">My Booked Tickets</h2>
            <p className="bookings-user-info">
              Showing tickets booked under <strong>{currentUser?.email}</strong>
            </p>
          </div>
          <button
            type="button"
            className="bookings-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="bookings-modal-content">
          {loading && (
            <div className="bookings-loading-state">
              <span className="loading-spinner" />
              <p>Fetching your tickets from database...</p>
            </div>
          )}

          {error && (
            <div className="bookings-error-state">
              <span>⚠️ {error}</span>
              <button
                type="button"
                className="btn btn-outline"
                onClick={loadBookings}
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && bookings.length === 0 && (
            <div className="bookings-empty-state">
              <span className="empty-icon">🎟️</span>
              <h3>No Bookings Found</h3>
              <p>You haven’t booked any movie tickets yet. Pick a blockbuster and reserve your seats!</p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onClose}
              >
                Browse Now Showing
              </button>
            </div>
          )}

          {!loading && !error && bookings.length > 0 && (
            <div className="bookings-list">
              {bookings.map((b) => (
                <article key={b.booking_ref} className="booking-ticket-item">
                  <div className="ticket-item-top">
                    <div className="ticket-ref-box">
                      <span className="ticket-label">BOOKING ID</span>
                      <strong className="ticket-code">{b.booking_ref}</strong>
                    </div>
                    <span className="ticket-status-pill">{b.payment_status}</span>
                  </div>

                  <div className="ticket-item-body">
                    <h3 className="ticket-item-title">{b.movie_title}</h3>
                    <p className="ticket-item-theater">📍 {b.theater_name}</p>
                    <div className="ticket-item-meta">
                      <span>📅 {b.show_date}</span>
                      <span>⏰ {b.show_time}</span>
                      <span className="ticket-item-format">{b.format}</span>
                    </div>

                    <div className="ticket-item-seats">
                      <span className="seats-label">Seats:</span>
                      <div className="seat-pills">
                        {b.seats.map((seat) => (
                          <span key={seat} className="seat-pill-confirmed">
                            {seat}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="ticket-item-footer">
                    <div>
                      <span className="paid-label">Total Paid:</span>
                      <strong className="paid-amount">₹{b.total_amount}</strong>
                    </div>
                    <span className="ticket-method-tag">
                      Via {b.payment_method.toUpperCase()}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
