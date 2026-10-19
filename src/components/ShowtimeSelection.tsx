import { useEffect, useState } from 'react';
import type { Movie } from '../types/movie';
import type { ShowDate, Theater, Showtime } from '../types/booking';
import { fetchShowDates, fetchTheatersForMovie } from '../services/movieApi';

interface ShowtimeSelectionProps {
  movie: Movie;
  selectedCity: string;
  onBackToListing: () => void;
  onContinueToSeats: (selection: {
    movie: Movie;
    date: ShowDate;
    theater: Theater;
    showtime: Showtime;
  }) => void;
}

function toShowDate(isoDate: string): ShowDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const value = new Date(year, month - 1, day, 12);
  if (
    value.getFullYear() !== year ||
    value.getMonth() !== month - 1 ||
    value.getDate() !== day
  ) {
    return null;
  }

  return {
    id: isoDate,
    label: value.toLocaleDateString('en-IN', { weekday: 'short' }),
    day: String(day),
    month: value.toLocaleDateString('en-IN', { month: 'short' }),
    fullDate: value.toLocaleDateString('en-IN', { dateStyle: 'full' }),
  };
}

export const ShowtimeSelection = ({
  movie,
  selectedCity,
  onBackToListing,
  onContinueToSeats,
}: ShowtimeSelectionProps) => {
  const [dates, setDates] = useState<ShowDate[]>([]);
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [selectedDate, setSelectedDate] = useState<ShowDate | null>(null);
  const [selectedTheater, setSelectedTheater] = useState<Theater | null>(null);
  const [selectedShowtime, setSelectedShowtime] = useState<Showtime | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetchShowDates(movie.id).then((items) => {
      const mapped = items.flatMap((iso) => {
        const showDate = toShowDate(iso);
        return showDate ? [showDate] : [];
      });
      setDates(mapped);
      setSelectedDate(mapped[0] ?? null);
      setLoadError(mapped.length ? null : 'No future showtimes are currently available.');
    }).catch(() => setLoadError('No future showtimes are currently available.'));
  }, [movie.id]);

  useEffect(() => {
    if (!selectedDate) return;
    fetchTheatersForMovie(movie.id, selectedDate.id).then((items) => {
      setTheaters(items); setSelectedTheater(items[0] ?? null); setSelectedShowtime(items[0]?.showtimes[0] ?? null);
    }).catch(() => setLoadError('Unable to load showtimes.'));
  }, [movie.id, selectedDate?.id]);

  const handleSelectShowtime = (theater: Theater, showtime: Showtime) => {
    setSelectedTheater(theater);
    setSelectedShowtime(showtime);
  };

  const handleContinue = () => {
    if (!selectedDate || !selectedTheater || !selectedShowtime) return;
    onContinueToSeats({
      movie,
      date: selectedDate,
      theater: selectedTheater,
      showtime: selectedShowtime,
    });
  };

  return (
    <div className="showtime-view-container">
      {/* Navigation breadcrumb bar */}
      <div className="showtime-breadcrumb-bar">
        <div className="breadcrumb-inner">
          <button
            type="button"
            className="btn btn-secondary back-button"
            onClick={onBackToListing}
          >
            ← Back to Movies
          </button>
          <div className="breadcrumb-location">
            <span>City:</span>
            <strong>📍 {selectedCity}</strong>
          </div>
        </div>
      </div>

      {/* Movie Details Hero Banner */}
      <section className="showtime-movie-hero">
        <div className="showtime-hero-backdrop">
          {movie.backdropUrl && (
            <img
              src={movie.backdropUrl}
              alt={movie.title}
              className="showtime-backdrop-img"
            />
          )}
          <div className="showtime-hero-overlay" />
        </div>

        <div className="showtime-hero-content">
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="showtime-movie-poster"
          />

          <div className="showtime-movie-info">
            <div className="movie-header-badges">
              <span className="badge badge-rating">⭐ {movie.rating} ({movie.votes})</span>
              <span className="badge">{movie.certification}</span>
              <span className="badge">⏱️ {movie.duration}</span>
              <span className="badge">🌐 {movie.language}</span>
              <span className="badge">{movie.releaseYear}</span>
            </div>

            <h1 className="showtime-movie-title">{movie.title}</h1>

            <div className="showtime-genre-row">
              {movie.genre.map((g) => (
                <span key={g} className="showtime-genre-pill">
                  {g}
                </span>
              ))}
            </div>

            <p className="showtime-movie-synopsis">{movie.synopsis}</p>

            <div className="showtime-credits-grid">
              {movie.director && (
                <div>
                  <span className="credit-label">Director</span>
                  <strong className="credit-value">{movie.director}</strong>
                </div>
              )}
              {movie.cast && movie.cast.length > 0 && (
                <div>
                  <span className="credit-label">Starring Cast</span>
                  <strong className="credit-value">{movie.cast.join(', ')}</strong>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Date Picker Strip */}
      <section className="showtime-dates-section">
        <div className="showtime-section-inner">
          <h2 className="section-heading">1. Select Show Date</h2>
          <div className="date-pills-carousel" role="tablist" aria-label="Show dates">
            {dates.map((dateItem) => {
              const isSelected = selectedDate?.id === dateItem.id;
              return (
                <button
                  key={dateItem.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  className={`date-chip ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedDate(dateItem)}
                >
                  <span className="chip-day-name">{dateItem.label}</span>
                  <span className="chip-day-num">{dateItem.day}</span>
                  <span className="chip-month">{dateItem.month}</span>
                </button>
              );
            })}
          </div>
          <p className="selected-date-indicator">
            📅 Showing showtimes for: <strong>{selectedDate?.fullDate ?? 'Loading...'}</strong>
          </p>
        </div>
      </section>

      {/* Theaters & Showtimes Grid */}
      <section className="showtime-theaters-section">
        <div className="showtime-section-inner">
          <h2 className="section-heading">2. Select Theater & Showtime</h2>
          <p className="section-disclaimer">
            Remaining-seat availability is calculated from the database.
          </p>

          <div className="theaters-stack">
            {theaters.map((theater) => (
              <article key={theater.id} className="theater-block">
                <div className="theater-info-row">
                  <div>
                    <h3 className="theater-title">{theater.name}</h3>
                    <p className="theater-address">
                      📍 {theater.location} • <span className="dist">{theater.distance}</span>
                    </p>
                  </div>
                  <div className="theater-amenity-tags">
                    <span className="amenity-tag">📱 M-Ticket</span>
                    <span className="amenity-tag">🍿 Food & Beverages</span>
                  </div>
                </div>

                <div className="showtimes-grid">
                  {theater.showtimes.map((st) => {
                    const isChosen =
                      selectedTheater?.id === theater.id &&
                      selectedShowtime?.id === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        className={`showtime-button ${isChosen ? 'active' : ''} ${st.status === 'Almost Full' ? 'status-almost-full' : ''}`}
                        onClick={() => handleSelectShowtime(theater, st)}
                        aria-pressed={isChosen}
                      >
                        <span className="st-time-text">{st.time}</span>
                        <span className="st-format-text">{st.format}</span>
                        <span className="st-status-badge">{st.status} · {(st as Showtime & { available_seats?: number }).available_seats ?? 80} seats left</span>
                        <span className="st-price-tag">₹{st.price}</span>
                      </button>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Floating Bottom Selection Summary Bar */}
      <aside className="sticky-booking-bar" aria-label="Booking Summary">
        <div className="sticky-bar-inner">
          <div className="selection-summary-text">
            <span className="summary-label">Currently Selected:</span>
            <div className="summary-values">
              <span className="summary-pill movie-pill">🎬 {movie.title}</span>
              <span className="summary-pill date-pill">📅 {selectedDate?.label ?? 'Choose a date'}</span>
              <span className="summary-pill theater-pill">📍 {selectedTheater?.name ?? 'Choose a theater'}</span>
              <span className="summary-pill time-pill">⏰ {selectedShowtime ? `${selectedShowtime.time} (${selectedShowtime.format})` : 'Choose a showtime'}</span>
            </div>
          </div>

          <div className="sticky-bar-actions">
            <div className="summary-price-box">
              <span className="price-title">Ticket Price</span>
              <span className="price-amount">₹{selectedShowtime?.price ?? 0}</span>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-lg continue-btn"
              onClick={handleContinue}
              disabled={!selectedDate || !selectedTheater || !selectedShowtime}
            >
              <span>Continue to Seats →</span>
            </button>
          </div>
        </div>
      </aside>
      {loadError && <p className="api-status-banner api-error-banner">{loadError}</p>}
    </div>
  );
};
