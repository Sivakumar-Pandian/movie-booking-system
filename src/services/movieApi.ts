import type { Movie } from '../types/movie';
import { MOVIES_DATA } from '../data/movies';
import { API_BASE_URL } from './apiConfig';
import type { Theater } from '../types/booking';

/**
 * Fetch movies from the FastAPI backend endpoint (GET /api/movies).
 * Falls back to local MOVIES_DATA when the backend server is unreachable.
 */
export async function fetchMoviesFromApi(): Promise<Movie[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/movies`);

    if (!response.ok) {
      console.warn(`Backend returned status ${response.status}. Falling back to default movie catalog.`);
      return MOVIES_DATA;
    }

    const data: Movie[] = await response.json();
    return Array.isArray(data) && data.length > 0 ? data : MOVIES_DATA;
  } catch (err: unknown) {
    console.warn('Backend server not reachable, using offline movie catalog:', err);
    return MOVIES_DATA;
  }
}

export async function fetchShowDates(movieId: string): Promise<string[]> {
  const res = await fetch(`${API_BASE_URL}/api/movies/${movieId}/show-dates`);
  if (!res.ok) throw new Error('Unable to load show dates.');
  return res.json();
}

export async function fetchTheatersForMovie(movieId: string, date: string): Promise<Theater[]> {
  const res = await fetch(`${API_BASE_URL}/api/movies/${movieId}/theaters?date=${encodeURIComponent(date)}`);
  if (!res.ok) throw new Error('Unable to load showtimes.');
  return res.json();
}

