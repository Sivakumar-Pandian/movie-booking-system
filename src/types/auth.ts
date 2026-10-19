export interface AuthUser {
  id: number;
  email: string;
  full_name: string;
  role: 'CUSTOMER' | 'ADMIN';
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}
