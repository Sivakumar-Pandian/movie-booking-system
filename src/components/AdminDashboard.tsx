import { useEffect, useRef, useState } from 'react';
import { getStoredToken } from '../services/authApi';
import { API_BASE_URL } from '../services/apiConfig';
import type { Movie } from '../types/movie';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onMoviesChange: (movies: Movie[]) => void;
}

interface MovieDraft {
  id: string;
  title: string;
  duration: string;
  language: string;
  certification: string;
  poster_url: string;
  synopsis: string;
  backdrop_url: string;
  trailer_url: string;
  rating: string;
  votes: string;
  genre: string;
  formats: string;
  release_year: string;
}

interface AdminTheater {
  id: string;
  name: string;
  location: string;
  distance: string;
}

interface AdminShowtime {
  id: string;
  movie_id: string;
  movie_title: string;
  theater_id: string;
  theater_name: string;
  show_date: string;
  time: string;
  format: string;
  price: number;
  has_bookings: boolean;
}

interface ShowtimeDraft {
  show_date: string;
  time: string;
  format: string;
  price: string;
}

const STANDARD_SHOWTIMES = ['10:00', '13:30', '17:00', '20:30'];

const emptyDraft: MovieDraft = {
  id: '',
  title: '',
  duration: '',
  language: '',
  certification: 'U',
  poster_url: '',
  synopsis: '',
  backdrop_url: '',
  trailer_url: '',
  rating: '0',
  votes: '0',
  genre: '',
  formats: '2D',
  release_year: String(new Date().getFullYear()),
};

function getDefaultScheduleDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 6);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function toApiTime(value: string): string {
  const [hourText, minute] = value.split(':');
  const hour = Number(hourText);
  return `${String(hour % 12 || 12).padStart(2, '0')}:${minute} ${hour >= 12 ? 'PM' : 'AM'}`;
}

function toInputTime(value: string): string {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(value.trim());
  if (!match) return '';
  const hour = Number(match[1]) % 12 + (match[3].toUpperCase() === 'PM' ? 12 : 0);
  return `${String(hour).padStart(2, '0')}:${match[2]}`;
}

function getApiErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object' || !('detail' in data)) return fallback;
  const { detail } = data;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item: unknown) => {
        if (!item || typeof item !== 'object' || !('msg' in item)) return null;
        return typeof item.msg === 'string' ? item.msg : null;
      })
      .filter((message): message is string => message !== null);
    if (messages.length) return messages.join(' ');
  }
  return fallback;
}

function adminHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getStoredToken() ?? ''}`,
  };
}

async function fetchMovies(): Promise<Movie[]> {
  const response = await fetch(`${API_BASE_URL}/api/admin/movies`, {
    headers: adminHeaders(),
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, 'Could not load movies.'));
  }
  return data as Movie[];
}

async function fetchTheaters(): Promise<AdminTheater[]> {
  const response = await fetch(`${API_BASE_URL}/api/admin/theaters`, {
    headers: adminHeaders(),
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, 'Could not load theaters.'));
  }
  return data as AdminTheater[];
}

async function fetchAdminShowtimes(movieId: string): Promise<AdminShowtime[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/admin/showtimes?movie_id=${encodeURIComponent(movieId)}`,
    { headers: adminHeaders() },
  );
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, 'Could not load showtimes.'));
  }
  return data as AdminShowtime[];
}

function splitList(value: string): string[] {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function getYoutubeId(value: string): string | null {
  const url = new URL(value);
  const hostname = url.hostname.toLowerCase();
  let videoId: string | null = null;

  if (hostname === 'youtu.be') {
    videoId = url.pathname.split('/').filter(Boolean)[0] ?? null;
  } else if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(hostname)) {
    videoId = url.searchParams.get('v');
    if (!videoId) {
      const pathParts = url.pathname.split('/').filter(Boolean);
      videoId = ['embed', 'shorts', 'live'].includes(pathParts[0] ?? '') ? pathParts[1] ?? null : null;
    }
  }

  return videoId && /^[A-Za-z0-9_-]{11}$/.test(videoId) ? videoId : null;
}

export function AdminDashboard({ isOpen, onClose, onMoviesChange }: Props) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [draft, setDraft] = useState<MovieDraft>(emptyDraft);
  const [editingMovieId, setEditingMovieId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [theaters, setTheaters] = useState<AdminTheater[]>([]);
  const [scheduleMovieId, setScheduleMovieId] = useState<string | null>(null);
  const [showtimes, setShowtimes] = useState<AdminShowtime[]>([]);
  const [showtimesLoading, setShowtimesLoading] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(getDefaultScheduleDate);
  const [selectedTheaterIds, setSelectedTheaterIds] = useState<string[]>([]);
  const [scheduleTimes, setScheduleTimes] = useState(STANDARD_SHOWTIMES);
  const [scheduleFormat, setScheduleFormat] = useState('2D');
  const [schedulePrice, setSchedulePrice] = useState('250');
  const [editingShowtimeId, setEditingShowtimeId] = useState<string | null>(null);
  const [showtimeDraft, setShowtimeDraft] = useState<ShowtimeDraft | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    let ignore = false;
    Promise.all([fetchMovies(), fetchTheaters()])
      .then(([data, availableTheaters]) => {
        if (!ignore) {
          setMovies(data);
          setTheaters(availableTheaters);
          onMoviesChange(data);
          setMessage('');
        }
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setMessage(error instanceof Error ? error.message : 'Could not connect to the admin API.');
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [isOpen, onMoviesChange]);

  useEffect(() => {
    if (!isOpen || !scheduleMovieId) return;
    let ignore = false;
    fetchAdminShowtimes(scheduleMovieId)
      .then((data) => {
        if (!ignore) setShowtimes(data);
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setMessage(error instanceof Error ? error.message : 'Could not load showtimes.');
        }
      })
      .finally(() => {
        if (!ignore) setShowtimesLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [isOpen, scheduleMovieId]);

  useEffect(() => {
    if (isFormOpen) contentRef.current?.scrollTo({ top: 0 });
  }, [isFormOpen]);

  if (!isOpen) return null;

  const setField = (field: keyof MovieDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setDraft(emptyDraft);
    setEditingMovieId(null);
    setIsFormOpen(false);
  };

  const openShowtimeManager = (movie: Movie) => {
    setShowtimesLoading(true);
    setScheduleMovieId(movie.id);
    setSelectedTheaterIds(theaters.map((theater) => theater.id));
    setScheduleTimes([...STANDARD_SHOWTIMES]);
    setScheduleDate(getDefaultScheduleDate());
    setScheduleFormat(movie.formats[0] ?? '2D');
    setSchedulePrice('250');
    setEditingShowtimeId(null);
    setShowtimeDraft(null);
    setMessage('');
  };

  const closeShowtimeManager = () => {
    setScheduleMovieId(null);
    setEditingShowtimeId(null);
    setShowtimeDraft(null);
    setMessage('');
  };

  const addStandardShowtimes = async () => {
    const movie = movies.find((item) => item.id === scheduleMovieId);
    if (
      !movie ||
      selectedTheaterIds.length === 0 ||
      !scheduleDate ||
      scheduleTimes.some((time) => !time) ||
      !Number.isInteger(Number(schedulePrice)) ||
      Number(schedulePrice) < 1
    ) {
      setMessage('Choose a theater and date, enter every showtime, and set a valid ticket price.');
      return;
    }
    setScheduleSaving(true);
    setMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/showtimes/standard`, {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({
          movie_id: movie.id,
          theater_ids: selectedTheaterIds,
          show_date: scheduleDate,
          times: scheduleTimes.map(toApiTime),
          format: scheduleFormat,
          price: Number(schedulePrice),
        }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(getApiErrorMessage(data, 'Could not create standard showtimes.'));
        return;
      }
      setMessage('Standard showtimes added.');
      setShowtimes(await fetchAdminShowtimes(movie.id));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not connect to the admin API.');
    } finally {
      setScheduleSaving(false);
    }
  };

  const startEditingShowtime = (showtime: AdminShowtime) => {
    setEditingShowtimeId(showtime.id);
    setShowtimeDraft({
      show_date: showtime.show_date,
      time: toInputTime(showtime.time),
      format: showtime.format,
      price: String(showtime.price),
    });
    setMessage('');
  };

  const saveShowtime = async (showtime: AdminShowtime) => {
    if (!showtimeDraft) return;
    if (
      !showtimeDraft.show_date ||
      !showtimeDraft.time ||
      !showtimeDraft.format.trim() ||
      !Number.isInteger(Number(showtimeDraft.price)) ||
      Number(showtimeDraft.price) < 1
    ) {
      setMessage('Enter a date, time, format, and valid ticket price for this show.');
      return;
    }
    setScheduleSaving(true);
    setMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/showtimes/${showtime.id}`, {
        method: 'PUT',
        headers: adminHeaders(),
        body: JSON.stringify({
          show_date: showtimeDraft.show_date,
          time: toApiTime(showtimeDraft.time),
          format: showtimeDraft.format,
          price: Number(showtimeDraft.price),
        }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(getApiErrorMessage(data, 'Could not update this showtime.'));
        return;
      }
      const updatedShowtime = data as AdminShowtime;
      setShowtimes((current) => current.map((item) => item.id === showtime.id ? updatedShowtime : item));
      setEditingShowtimeId(null);
      setShowtimeDraft(null);
      setMessage('Showtime updated.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not connect to the admin API.');
    } finally {
      setScheduleSaving(false);
    }
  };

  const removeShowtime = async (showtime: AdminShowtime) => {
    if (!window.confirm(`Delete the ${showtime.time} show at ${showtime.theater_name}?`)) return;
    setScheduleSaving(true);
    setMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/showtimes/${showtime.id}`, {
        method: 'DELETE',
        headers: adminHeaders(),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(getApiErrorMessage(data, 'Could not delete this showtime.'));
        return;
      }
      setShowtimes((current) => current.filter((item) => item.id !== showtime.id));
      setMessage('Showtime deleted.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not connect to the admin API.');
    } finally {
      setScheduleSaving(false);
    }
  };

  const addMovie = () => {
    setDraft(emptyDraft);
    setEditingMovieId(null);
    setIsFormOpen(true);
    setMessage('');
  };

  const editMovie = (movie: Movie) => {
    setEditingMovieId(movie.id);
    setIsFormOpen(true);
    setDraft({
      id: movie.id,
      title: movie.title,
      duration: movie.duration,
      language: movie.language,
      certification: movie.certification,
      poster_url: movie.posterUrl,
      synopsis: movie.synopsis,
      backdrop_url: movie.backdropUrl ?? '',
      trailer_url: movie.trailerYoutubeId
        ? `https://www.youtube.com/watch?v=${movie.trailerYoutubeId}`
        : '',
      rating: String(movie.rating),
      votes: movie.votes,
      genre: movie.genre.join(', '),
      formats: movie.formats.join(', '),
      release_year: String(movie.releaseYear),
    });
    setMessage('');
  };

  const submitMovie = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const isNewMovie = !editingMovieId;
    setSaving(true);
    setMessage('');
    let trailerYoutubeId: string | null = null;
    try {
      trailerYoutubeId = draft.trailer_url.trim() ? getYoutubeId(draft.trailer_url.trim()) : null;
    } catch {
      setMessage('Enter a valid YouTube trailer link.');
      setSaving(false);
      return;
    }
    if (draft.trailer_url.trim() && !trailerYoutubeId) {
      setMessage('Enter a valid YouTube trailer link.');
      setSaving(false);
      return;
    }

    const payload = {
      id: editingMovieId ?? undefined,
      title: draft.title.trim(),
      duration: draft.duration.trim(),
      language: draft.language.trim(),
      certification: draft.certification.trim(),
      poster_url: draft.poster_url.trim(),
      backdrop_url: draft.backdrop_url.trim() || null,
      trailer_youtube_id: trailerYoutubeId,
      synopsis: draft.synopsis.trim(),
      rating: Number(draft.rating),
      votes: draft.votes.trim() || '0',
      genre: splitList(draft.genre),
      formats: splitList(draft.formats),
      release_year: Number(draft.release_year),
    };

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/movies${editingMovieId ? `/${editingMovieId}` : ''}`,
        {
          method: editingMovieId ? 'PUT' : 'POST',
          headers: adminHeaders(),
          body: JSON.stringify(payload),
        },
      );
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(getApiErrorMessage(data, 'Could not save this movie.'));
        return;
      }
      setMessage(editingMovieId ? 'Movie updated.' : 'Movie added.');
      const savedMovie = data as Movie;
      const updatedMovies = (
        editingMovieId
          ? movies.map((movie) => movie.id === savedMovie.id ? savedMovie : movie)
          : [...movies, savedMovie]
      ).sort((first, second) => first.title.localeCompare(second.title));
      setMovies(updatedMovies);
      onMoviesChange(updatedMovies);
      resetForm();
      if (isNewMovie) {
        openShowtimeManager(savedMovie);
        setMessage('Movie added. Choose theaters, a date, and showtimes to schedule it.');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not connect to the admin API.');
    } finally {
      setSaving(false);
    }
  };

  const deleteMovie = async (movie: Movie) => {
    if (!window.confirm(`Delete "${movie.title}"?`)) return;
    setMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/movies/${movie.id}`, {
        method: 'DELETE',
        headers: adminHeaders(),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(getApiErrorMessage(data, 'Could not delete this movie.'));
        return;
      }
      const updatedMovies = movies.filter((item) => item.id !== movie.id);
      setMovies(updatedMovies);
      onMoviesChange(updatedMovies);
      if (editingMovieId === movie.id) resetForm();
      setMessage('Movie deleted.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not connect to the admin API.');
    }
  };

  const scheduleMovie = movies.find((movie) => movie.id === scheduleMovieId);
  const availableFormats = scheduleMovie?.formats.filter(Boolean) ?? [];

  return (
    <div className="bookings-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="admin-title">
      <section className="bookings-modal-card admin-modal-card">
        <header className="bookings-modal-header">
          <div>
            <span className="bookings-badge">ADMIN CONSOLE</span>
            <h2 className="bookings-title" id="admin-title">Manage movies</h2>
            <p className="admin-description">Add titles to the catalog or update and remove existing movies.</p>
          </div>
          <button type="button" className="bookings-close-btn" onClick={onClose} aria-label="Close admin dashboard">✕</button>
        </header>

        <div className="admin-content" ref={contentRef}>
          {message && <p className="admin-message" role="status">{message}</p>}

          {scheduleMovieId ? (
          <section className="admin-section" aria-labelledby="showtime-manager-title">
            <div className="admin-section-heading">
              <div>
                <h3 id="showtime-manager-title">
                  Showtimes for {scheduleMovie?.title}
                </h3>
                <p>The default date avoids the preloaded sample schedules. Choose theaters and set the showtimes; you can adjust individual shows below.</p>
              </div>
              <button type="button" className="admin-cancel-edit" onClick={closeShowtimeManager}>Back to movies</button>
            </div>

            <div className="admin-schedule-form">
              <label>
                Show date
                <input type="date" value={scheduleDate} onChange={(event) => setScheduleDate(event.target.value)} required />
              </label>
              <fieldset className="admin-theater-picker admin-field-wide">
                <legend>Select theaters</legend>
                {theaters.map((theater) => (
                  <label key={theater.id} className="admin-theater-option">
                    <input
                      type="checkbox"
                      checked={selectedTheaterIds.includes(theater.id)}
                      onChange={(event) => setSelectedTheaterIds((current) =>
                        event.target.checked
                          ? [...current, theater.id]
                          : current.filter((id) => id !== theater.id),
                      )}
                    />
                    <span><strong>{theater.name}</strong><small>{theater.location}</small></span>
                  </label>
                ))}
              </fieldset>
              <div className="admin-standard-times admin-field-wide">
                <div className="admin-standard-times-heading">
                  <strong>Standard showtimes</strong>
                  <button type="button" className="admin-button" onClick={() => setScheduleTimes((current) => [...current, ''])}>
                    Add time
                  </button>
                </div>
                <div className="admin-time-inputs">
                  {scheduleTimes.map((time, index) => (
                    <label key={`standard-time-${index}`}>
                      Show {index + 1}
                      <span className="admin-time-input-row">
                        <input
                          type="time"
                          value={time}
                          onChange={(event) => setScheduleTimes((current) => current.map((item, itemIndex) =>
                            itemIndex === index ? event.target.value : item,
                          ))}
                          required
                        />
                        {scheduleTimes.length > 1 && (
                          <button
                            type="button"
                            className="admin-button admin-button-delete"
                            onClick={() => setScheduleTimes((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                            aria-label={`Remove showtime ${index + 1}`}
                          >
                            Remove
                          </button>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <label>
                Format
                <select value={scheduleFormat} onChange={(event) => setScheduleFormat(event.target.value)}>
                  {Array.from(new Set(availableFormats.length ? availableFormats : ['2D'])).map((format) => (
                    <option key={format} value={format}>{format}</option>
                  ))}
                </select>
              </label>
              <label>
                Ticket price (₹)
                <input type="number" min={1} step={1} value={schedulePrice} onChange={(event) => setSchedulePrice(event.target.value)} required />
              </label>
              <div className="admin-form-actions admin-field-wide">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => void addStandardShowtimes()}
                  disabled={scheduleSaving || !theaters.length}
                >
                  {scheduleSaving ? 'Saving…' : 'Add standard showtimes'}
                </button>
              </div>
            </div>

            <div className="admin-existing-showtimes">
              <h4>Scheduled shows</h4>
              {showtimesLoading ? (
                <p className="admin-empty-state">Loading showtimes…</p>
              ) : showtimes.length === 0 ? (
                <p className="admin-empty-state">No showtimes are scheduled for this movie yet.</p>
              ) : (
                showtimes.map((showtime) => (
                  <article className="admin-showtime-row" key={showtime.id}>
                    {editingShowtimeId === showtime.id && showtimeDraft ? (
                      <div className="admin-showtime-edit">
                        <label>
                          Date
                          <input type="date" value={showtimeDraft.show_date} onChange={(event) => setShowtimeDraft((draft) => draft ? { ...draft, show_date: event.target.value } : draft)} required />
                        </label>
                        <label>
                          Time
                          <input type="time" value={showtimeDraft.time} onChange={(event) => setShowtimeDraft((draft) => draft ? { ...draft, time: event.target.value } : draft)} required />
                        </label>
                        <label>
                          Format
                          <input value={showtimeDraft.format} onChange={(event) => setShowtimeDraft((draft) => draft ? { ...draft, format: event.target.value } : draft)} required />
                        </label>
                        <label>
                          Price (₹)
                          <input type="number" min={1} value={showtimeDraft.price} onChange={(event) => setShowtimeDraft((draft) => draft ? { ...draft, price: event.target.value } : draft)} required />
                        </label>
                        <div className="admin-movie-actions">
                          <button type="button" className="admin-button admin-button-edit" onClick={() => void saveShowtime(showtime)} disabled={scheduleSaving}>Save</button>
                          <button type="button" className="admin-button" onClick={() => { setEditingShowtimeId(null); setShowtimeDraft(null); }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="admin-showtime-info">
                          <strong>{showtime.theater_name}</strong>
                          <span>{showtime.show_date} · {showtime.time} · {showtime.format} · ₹{showtime.price}</span>
                          {showtime.has_bookings && <small>Bookings exist — this show cannot be changed or removed.</small>}
                        </div>
                        <div className="admin-movie-actions">
                          <button type="button" className="admin-button admin-button-edit" onClick={() => startEditingShowtime(showtime)} disabled={showtime.has_bookings}>Edit time</button>
                          <button type="button" className="admin-button admin-button-delete" onClick={() => void removeShowtime(showtime)} disabled={showtime.has_bookings || scheduleSaving}>Delete</button>
                        </div>
                      </>
                    )}
                  </article>
                ))
              )}
            </div>
          </section>
          ) : !isFormOpen ? (
          <section className="admin-section" aria-labelledby="movie-list-title">
            <div className="admin-section-heading">
              <div>
                <h3 id="movie-list-title">Movie catalog</h3>
                <p>{movies.length} {movies.length === 1 ? 'movie' : 'movies'}</p>
              </div>
              <button type="button" className="btn btn-primary" onClick={addMovie}>Add movie</button>
            </div>
            {loading ? (
              <p className="admin-empty-state">Loading movies…</p>
            ) : movies.length === 0 ? (
              <p className="admin-empty-state">No movies yet. Add your first movie to get started.</p>
            ) : (
              <div className="admin-movie-list">
                {movies.map((movie) => (
                  <article className="admin-movie-row" key={movie.id}>
                    <img
                      className="admin-movie-poster"
                      src={movie.posterUrl || 'https://placehold.co/72x96?text=Movie'}
                      alt=""
                    />
                    <div className="admin-movie-info">
                      <strong>{movie.title}</strong>
                      <span>{movie.language} · {movie.duration} · {movie.certification}</span>
                    </div>
                    <div className="admin-movie-actions">
                      <button type="button" className="admin-button" onClick={() => openShowtimeManager(movie)}>Showtimes</button>
                      <button type="button" className="admin-button admin-button-edit" onClick={() => editMovie(movie)}>Edit</button>
                      <button type="button" className="admin-button admin-button-delete" onClick={() => void deleteMovie(movie)}>Delete</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
          ) : (
          <section className="admin-section" aria-labelledby="movie-form-title">
            <div className="admin-section-heading">
              <div>
                <h3 id="movie-form-title">{editingMovieId ? 'Edit movie' : 'Add a movie'}</h3>
                <p>
                  {editingMovieId
                    ? 'Update the movie details below.'
                    : 'Enter the movie details; after saving, you can choose theaters and showtimes.'}
                </p>
              </div>
              <button type="button" className="admin-cancel-edit" onClick={resetForm}>
                {editingMovieId ? 'Cancel edit' : 'Cancel'}
              </button>
            </div>

            <form className="admin-movie-form" onSubmit={(event) => void submitMovie(event)}>
              {editingMovieId && (
                <label>
                  Movie ID
                  <input value={draft.id} disabled />
                </label>
              )}
              <label>
                Title
                <input value={draft.title} onChange={(event) => setField('title', event.target.value)} required placeholder="Movie title" />
              </label>
              <label>
                Duration
                <input value={draft.duration} onChange={(event) => setField('duration', event.target.value)} required placeholder="2h 30m" />
              </label>
              <label>
                Language
                <input value={draft.language} onChange={(event) => setField('language', event.target.value)} required placeholder="English" />
              </label>
              <label>
                Certification
                <select value={draft.certification} onChange={(event) => setField('certification', event.target.value)}>
                  <option value="U">U</option>
                  <option value="UA">UA</option>
                  <option value="A">A</option>
                </select>
              </label>
              <label>
                Release year
                <input type="number" value={draft.release_year} onChange={(event) => setField('release_year', event.target.value)} required min={1900} max={2200} />
              </label>
              <label className="admin-field-wide">
                Poster image URL
                <input type="url" value={draft.poster_url} onChange={(event) => setField('poster_url', event.target.value)} required placeholder="https://…" />
              </label>
              <label className="admin-field-wide">
                Background image URL
                <input type="url" value={draft.backdrop_url} onChange={(event) => setField('backdrop_url', event.target.value)} placeholder="https://…" />
              </label>
              <label className="admin-field-wide">
                YouTube trailer link
                <input type="url" value={draft.trailer_url} onChange={(event) => setField('trailer_url', event.target.value)} placeholder="https://www.youtube.com/watch?v=…" />
              </label>
              <label>
                Genres <span>(comma-separated)</span>
                <input value={draft.genre} onChange={(event) => setField('genre', event.target.value)} placeholder="Action, Drama" />
              </label>
              <label>
                Formats <span>(comma-separated)</span>
                <input value={draft.formats} onChange={(event) => setField('formats', event.target.value)} placeholder="2D, IMAX 3D" />
              </label>
              <label className="admin-field-wide">
                Synopsis
                <textarea value={draft.synopsis} onChange={(event) => setField('synopsis', event.target.value)} rows={3} placeholder="Short movie description" />
              </label>
              <details className="admin-optional-fields admin-field-wide">
                <summary>Optional catalog details</summary>
                <div className="admin-optional-grid">
                  <label>
                    Rating
                    <input type="number" value={draft.rating} onChange={(event) => setField('rating', event.target.value)} min={0} max={10} step={0.1} />
                  </label>
                  <label>
                    Votes
                    <input value={draft.votes} onChange={(event) => setField('votes', event.target.value)} placeholder="0" />
                  </label>
                </div>
              </details>
              <div className="admin-form-actions admin-field-wide">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : editingMovieId ? 'Save changes' : 'Add movie & choose showtimes'}
                </button>
              </div>
            </form>
          </section>
          )}
        </div>
      </section>
    </div>
  );
}
