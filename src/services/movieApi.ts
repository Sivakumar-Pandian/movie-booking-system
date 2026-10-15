import type { Movie } from '../types/movie';

// Base URL for the FastAPI backend, configurable via Vite environment variables
const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) || 'http://localhost:8000';

/**
 * Fetch movies from the FastAPI backend endpoint (GET /api/movies).
 * Handles network failure and HTTP status errors safely.
 */
export async function fetchMoviesFromApi(): Promise<Movie[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/movies`);

    // Guard: fetch() only rejects on network failures, not on HTTP 4xx/5xx responses!
    if (!response.ok) {
      throw new Error(
        `Server returned error ${response.status}: ${response.statusText || 'Unable to load movies'}`
      );
    }

    const data: Movie[] = await response.json();
    return data;
  } catch (err: unknown) {
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new Error(
        `Cannot connect to backend server at ${API_BASE_URL}. Ensure the FastAPI server is running.`
      );
    }
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('An unexpected error occurred while fetching movies.');
  }
}
