import type { Movie } from '../types/movie';
import { MOVIES_DATA } from '../data/movies';

// Base URL for the FastAPI backend, configurable via Vite environment variables
const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) || 'http://localhost:8000';

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

