import type { AuthUser, AuthResponse, RegisterPayload, LoginPayload } from '../types/auth';

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) || 'http://localhost:8000';

const TOKEN_KEY = 'yozigo_auth_token';
const USER_KEY = 'yozigo_user';

export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const getStoredUser = (): AuthUser | null => {
  const userJson = localStorage.getItem(USER_KEY);
  if (!userJson) return null;
  try {
    return JSON.parse(userJson) as AuthUser;
  } catch {
    return null;
  }
};

export const setStoredAuth = (token: string, user: AuthUser): void => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearStoredAuth = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export async function registerApi(payload: RegisterPayload): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Registration failed' }));
    throw new Error(errorData.detail || 'Failed to create account.');
  }

  const data: AuthResponse = await res.json();
  setStoredAuth(data.access_token, data.user);
  return data;
}

export async function loginApi(payload: LoginPayload): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Login failed' }));
    throw new Error(errorData.detail || 'Invalid email or password.');
  }

  const data: AuthResponse = await res.json();
  setStoredAuth(data.access_token, data.user);
  return data;
}

export async function fetchMeApi(): Promise<AuthUser> {
  const token = getStoredToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    clearStoredAuth();
    throw new Error('Session expired');
  }

  const user: AuthUser = await res.json();
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}
