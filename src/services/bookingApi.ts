import { getStoredToken } from './authApi';
import { API_BASE_URL } from './apiConfig';

export interface ApiBookingRecord {
  id: number;
  booking_ref: string;
  showtime_id: string;
  movie_title: string;
  theater_name: string;
  theater_location?: string;
  show_date: string;
  show_time: string;
  format: string;
  seats: string[];
  seat_count: number;
  price_per_seat: number;
  subtotal: number;
  convenience_fee: number;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  created_at: string;
}

export interface CreateBookingPayload {
  showtime_id: string;
  movie_title: string;
  theater_name: string;
  theater_location?: string;
  show_date: string;
  show_time: string;
  format: string;
  seats: string[];
  payment_method: string;
  price_per_seat: number;
  subtotal: number;
  convenience_fee: number;
  total_amount: number;
}

export async function fetchShowtimeBookedSeats(showtimeId: string): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/showtimes/${showtimeId}/seats`);
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    return data.booked_seats || [];
  } catch {
    return [];
  }
}

export interface SeatAvailability {
  booked: string[];
  held: string[];
}

export async function fetchSeatAvailability(showtimeId: string): Promise<SeatAvailability> {
  const res = await fetch(`${API_BASE_URL}/api/showtimes/${showtimeId}/seats`);
  if (!res.ok) throw new Error('Unable to refresh seat availability.');
  const data = await res.json();
  return { booked: data.booked_seats ?? [], held: data.held_seats ?? [] };
}

export async function createSeatHold(showtimeId: string, seats: string[]) {
  const token = getStoredToken();
  if (!token) throw new Error('Please sign in before holding seats.');
  const res = await fetch(`${API_BASE_URL}/api/holds`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ showtime_id: showtimeId, seats }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail ?? 'Unable to hold the selected seats.');
  return data as { showtime_id: string; seats: string[]; expires_at: string };
}

export async function confirmHeldPayment(showtimeId: string, seats: string[], paymentMethod: string) {
  const token = getStoredToken();
  const res = await fetch(`${API_BASE_URL}/api/payments`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ showtime_id: showtimeId, seats, payment_method: paymentMethod, success: true }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail ?? 'Unable to confirm payment.');
  return data as ApiBookingRecord;
}

export async function createRealBooking(payload: CreateBookingPayload): Promise<ApiBookingRecord> {
  const token = getStoredToken();
  if (!token) {
    throw new Error('You must be logged in to complete a ticket booking.');
  }

  const res = await fetch(`${API_BASE_URL}/api/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Failed to create booking' }));
    if (res.status === 409) {
      throw new Error(
        errorData.detail ||
          'Conflict: One or more selected seats were already booked by another user. Please choose different seats.'
      );
    }
    throw new Error(errorData.detail || 'Unable to complete booking. Please try again.');
  }

  return await res.json();
}

export async function fetchUserBookings(): Promise<ApiBookingRecord[]> {
  const token = getStoredToken();
  if (!token) return [];

  const res = await fetch(`${API_BASE_URL}/api/bookings`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to load your booking history.');
  }

  return await res.json();
}

export async function cancelBooking(bookingRef: string): Promise<void> {
  const token = getStoredToken();
  const res = await fetch(`${API_BASE_URL}/api/bookings/${bookingRef}/cancel`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail ?? 'Unable to cancel this booking.');
  }
}
