import { useState } from 'react';
import type { Movie } from '../types/movie';

interface BookingNoticeModalProps {
  movie: Movie | null;
  onClose: () => void;
  selectedCity: string;
}

const SAMPLE_DATES = [
  { id: 'd1', label: 'Today', day: '15', month: 'Oct', isToday: true },
  { id: 'd2', label: 'Tomorrow', day: '16', month: 'Oct' },
  { id: 'd3', label: 'Sat', day: '17', month: 'Oct' },
  { id: 'd4', label: 'Sun', day: '18', month: 'Oct' },
  { id: 'd5', label: 'Mon', day: '19', month: 'Oct' },
];

const SAMPLE_THEATERS = [
  {
    name: 'PVR INOX: Forum South Mall, IMAX',
    distance: '3.2 km away',
    formats: ['IMAX 3D', '4DX', '2D'],
    showtimes: [
      { time: '10:30 AM', status: 'Filling Fast', format: 'IMAX 3D' },
      { time: '01:45 PM', status: 'Available', format: '4DX' },
      { time: '05:30 PM', status: 'Almost Full', format: 'IMAX 3D' },
      { time: '09:15 PM', status: 'Available', format: '2D' },
    ],
  },
  {
    name: 'Cinepolis: Nexus Grand Screen',
    distance: '5.8 km away',
    formats: ['Dolby Atmos', '2D'],
    showtimes: [
      { time: '11:00 AM', status: 'Available', format: 'Dolby Atmos' },
      { time: '02:30 PM', status: 'Available', format: '2D' },
      { time: '06:15 PM', status: 'Filling Fast', format: 'Dolby Atmos' },
      { time: '10:00 PM', status: 'Available', format: '2D' },
    ],
  },
];

export const BookingNoticeModal = ({
  movie,
  onClose,
  selectedCity,
}: BookingNoticeModalProps) => {
  const [selectedDateId, setSelectedDateId] = useState('d1');
  const [selectedShowtime, setSelectedShowtime] = useState<string | null>('05:30 PM');
  const [selectedTheater, setSelectedTheater] = useState(SAMPLE_THEATERS[0].name);

  if (!movie) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="booking-modal-card" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Close booking modal"
        >
          ✕
        </button>

        {/* Header Movie Spotlight */}
        <div className="booking-modal-header">
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="booking-modal-poster"
          />
          <div className="booking-modal-header-info">
            <span className="booking-status-tag">🎟️ Select Showtimes & Theater</span>
            <h2 className="booking-modal-title">{movie.title}</h2>
            <div className="booking-modal-badges">
              <span className="badge badge-rating">⭐ {movie.rating} ({movie.votes})</span>
              <span className="badge">{movie.certification}</span>
              <span className="badge">⏱️ {movie.duration}</span>
              <span className="badge">📍 {selectedCity}</span>
            </div>
            <div className="booking-modal-formats">
              {movie.formats.map((f) => (
                <span key={f} className="format-pill">{f}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Date Selector Strip */}
        <div className="booking-dates-strip">
          <label className="strip-label">Choose Date</label>
          <div className="dates-row">
            {SAMPLE_DATES.map((d) => (
              <button
                key={d.id}
                type="button"
                className={`date-pill ${selectedDateId === d.id ? 'active' : ''}`}
                onClick={() => setSelectedDateId(d.id)}
              >
                <span className="date-label">{d.label}</span>
                <span className="date-number">{d.day}</span>
                <span className="date-month">{d.month}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Theater & Showtimes List */}
        <div className="theaters-list">
          <label className="strip-label">Available Theaters in {selectedCity}</label>
          {SAMPLE_THEATERS.map((theater) => (
            <div
              key={theater.name}
              className={`theater-card ${selectedTheater === theater.name ? 'selected' : ''}`}
              onClick={() => setSelectedTheater(theater.name)}
            >
              <div className="theater-header">
                <div>
                  <h4 className="theater-name">{theater.name}</h4>
                  <span className="theater-dist">🚗 {theater.distance} • M-Ticket & Food Pre-Order Available</span>
                </div>
              </div>

              <div className="showtimes-row">
                {theater.showtimes.map((st) => {
                  const isChosen =
                    selectedTheater === theater.name && selectedShowtime === st.time;
                  return (
                    <button
                      key={st.time}
                      type="button"
                      className={`showtime-chip ${isChosen ? 'active' : ''} ${st.status === 'Almost Full' ? 'almost-full' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTheater(theater.name);
                        setSelectedShowtime(st.time);
                      }}
                    >
                      <span className="st-time">{st.time}</span>
                      <span className="st-format">{st.format}</span>
                      <span className="st-status">{st.status}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Milestone Indicator Banner */}
        <div className="booking-milestone-notice">
          <div className="notice-icon">💡</div>
          <div>
            <strong>Milestone 1 Preview Active:</strong> You picked <u>{movie.title}</u> for{' '}
            <u>{selectedShowtime ?? '05:30 PM'}</u> at <u>{selectedTheater}</u>!
            <p className="notice-sub">
              Full interactive seat layout map (VIP, Recliner, Premium) and checkout will unlock in Milestone 2.
            </p>
          </div>
        </div>

        {/* Modal Action CTA */}
        <div className="booking-modal-cta">
          <div className="cta-price-box">
            <span className="price-label">Tickets from</span>
            <span className="price-val">₹250 - ₹650</span>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={onClose}
          >
            Ready for Milestone 2 Seat Layout →
          </button>
        </div>
      </div>
    </div>
  );
};
