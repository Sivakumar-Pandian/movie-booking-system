/**
 * Resolves the base URL for API requests.
 * In production or on hosted environments (non-localhost), defaults to same-origin relative path ''
 * so all `/api/*` calls route directly through Vercel's multi-service backend routing.
 */
export function getApiBaseUrl(): string {
  const envUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();

  // If in browser and running on a deployed host (e.g. *.vercel.app),
  // prevent localhost/127.0.0.1 from breaking browser calls with mixed content.
  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    if (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) {
      return '';
    }
    return envUrl;
  }

  if (envUrl) {
    return envUrl;
  }

  return import.meta.env.DEV ? 'http://localhost:8000' : '';
}

export const API_BASE_URL = getApiBaseUrl();
