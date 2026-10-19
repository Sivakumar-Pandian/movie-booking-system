import { useEffect, useState } from 'react';
import { getStoredToken } from '../services/authApi';
import { API_BASE_URL } from '../services/apiConfig';
import type { Movie } from '../types/movie';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface Report {
  showtime_id: string;
  movie_title: string;
  show_date: string;
  time: string;
  booked_seats: number;
  capacity: number;
  occupancy_percent: number;
  total_collected: number;
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
      .filter((error): error is string => error !== null);
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

async function fetchAdminData(): Promise<{ reports: Report[]; movies: Movie[] }> {
  const [reportResponse, movieResponse] = await Promise.all([
    fetch(`${API_BASE_URL}/api/admin/reports/shows`, { headers: adminHeaders() }),
    fetch(`${API_BASE_URL}/api/admin/movies`, { headers: adminHeaders() }),
  ]);
  if (!reportResponse.ok || !movieResponse.ok) {
    throw new Error('Could not load admin data. Please sign in again with an admin account.');
  }
  return {
    reports: await reportResponse.json(),
    movies: await movieResponse.json(),
  };
}

export function AdminDashboard({ isOpen, onClose }: Props) {
  const [reports, setReports] = useState<Report[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [message, setMessage] = useState('');
  const [movieJson, setMovieJson] = useState('{"id":"new-movie","title":"New Movie","duration":"2h 0m","language":"English","certification":"UA","poster_url":"https://placehold.co/300x450","genre":["Drama"],"formats":["2D"]}');
  const [showJson, setShowJson] = useState('{"id":"new-show","movie_id":"new-movie","theater_id":"th-1","show_date":"2026-12-01","time":"07:30 PM","format":"2D","price":250}');
  const [editingMovieId, setEditingMovieId] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await fetchAdminData();
      setReports(data.reports);
      setMovies(data.movies);
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not connect to the admin API.');
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    let ignore = false;
    const loadWhenOpened = async () => {
      try {
        const data = await fetchAdminData();
        if (ignore) return;
        setReports(data.reports);
        setMovies(data.movies);
        setMessage('');
      } catch (error) {
        if (!ignore) {
          setMessage(error instanceof Error ? error.message : 'Could not connect to the admin API.');
        }
      }
    };
    void loadWhenOpened();
    return () => {
      ignore = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const submit = async (url: string, body: string, method: 'POST' | 'PUT' = 'POST') => {
    try {
      JSON.parse(body);
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method,
        headers: adminHeaders(),
        body,
      });
      const data: unknown = await response.json().catch(() => null);
      setMessage(response.ok ? 'Saved successfully.' : getApiErrorMessage(data, 'Save failed.'));
      if (response.ok) {
        setEditingMovieId(null);
        void load();
      }
    } catch (error) {
      setMessage(error instanceof SyntaxError ? 'Enter valid JSON before saving.' : 'Could not connect to the admin API.');
    }
  };

  const editMovie = (movie: Movie) => {
    setEditingMovieId(movie.id);
    setMovieJson(JSON.stringify({
      id: movie.id,
      title: movie.title,
      duration: movie.duration,
      language: movie.language,
      certification: movie.certification,
      poster_url: movie.posterUrl,
      synopsis: movie.synopsis,
      rating: movie.rating,
      votes: movie.votes,
      genre: movie.genre,
      formats: movie.formats,
      release_year: movie.releaseYear,
    }, null, 2));
  };

  const deleteMovie = async (movie: Movie) => {
    if (!window.confirm(`Delete "${movie.title}"?`)) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/movies/${movie.id}`, {
        method: 'DELETE',
        headers: adminHeaders(),
      });
      const data: unknown = await response.json().catch(() => null);
      setMessage(response.ok ? 'Movie deleted.' : getApiErrorMessage(data, 'Could not delete movie.'));
      if (response.ok) void load();
    } catch {
      setMessage('Could not connect to the admin API.');
    }
  };

  const deleteShowtime = async (report: Report) => {
    if (!window.confirm(`Delete the ${report.movie_title} show on ${report.show_date} at ${report.time}?`)) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/showtimes/${report.showtime_id}`, {
        method: 'DELETE',
        headers: adminHeaders(),
      });
      const data: unknown = await response.json().catch(() => null);
      setMessage(response.ok ? 'Showtime deleted.' : getApiErrorMessage(data, 'Could not delete showtime.'));
      if (response.ok) void load();
    } catch {
      setMessage('Could not connect to the admin API.');
    }
  };

  return (
    <div className="bookings-modal-overlay" role="dialog" aria-modal="true">
      <div className="bookings-modal-card">
        <div className="bookings-modal-header">
          <div><span className="bookings-badge">ADMIN</span><h2 className="bookings-title">Cinema Management</h2></div>
          <button className="bookings-close-btn" onClick={onClose} aria-label="Close admin dashboard">✕</button>
        </div>
        <div className="bookings-modal-content">
          {message && <p role="status">{message}</p>}
          <h3>Movies</h3>
          {movies.map((movie) => (
            <p key={movie.id}>
              <strong>{movie.title}</strong> ({movie.id}){' '}
              <button type="button" onClick={() => editMovie(movie)}>Edit</button>{' '}
              <button type="button" onClick={() => void deleteMovie(movie)}>Delete</button>
            </p>
          ))}
          <h3>{editingMovieId ? `Edit movie: ${editingMovieId}` : 'Add movie'}</h3>
          <textarea aria-label="Movie JSON" value={movieJson} onChange={(event) => setMovieJson(event.target.value)} rows={8} style={{ width: '100%' }} />
          <button
            className="btn btn-primary"
            onClick={() => void submit(
              editingMovieId ? `/api/admin/movies/${editingMovieId}` : '/api/admin/movies',
              movieJson,
              editingMovieId ? 'PUT' : 'POST',
            )}
          >
            {editingMovieId ? 'Save movie changes' : 'Add movie'}
          </button>
          {editingMovieId && <button type="button" onClick={() => setEditingMovieId(null)}>Cancel edit</button>}

          <h3>Show performance</h3>
          {reports.map((report) => (
            <p key={report.showtime_id}>
              <strong>{report.movie_title}</strong> — {report.show_date}, {report.time}: {report.booked_seats}/{report.capacity} ({report.occupancy_percent}%), ₹{report.total_collected}{' '}
              <button type="button" onClick={() => void deleteShowtime(report)}>Delete showtime</button>
            </p>
          ))}
          <h3>Add showtime</h3>
          <textarea aria-label="Showtime JSON" value={showJson} onChange={(event) => setShowJson(event.target.value)} rows={5} style={{ width: '100%' }} />
          <button className="btn btn-primary" onClick={() => void submit('/api/admin/showtimes', showJson)}>Add showtime</button>
        </div>
      </div>
    </div>
  );
}
