import type { Movie } from './movie';

export interface ShowDate {
  id: string;
  label: string; // e.g. "Today", "Tomorrow", "Sat"
  day: string; // e.g. "15"
  month: string; // e.g. "Oct"
  fullDate: string; // e.g. "Thursday, 15 Oct 2026"
}

export interface Showtime {
  id: string;
  time: string; // e.g. "10:30 AM"
  format: string; // e.g. "IMAX 3D", "4DX", "2D"
  status: 'Available' | 'Filling Fast' | 'Almost Full';
  price: number;
}

export interface Theater {
  id: string;
  name: string;
  location: string;
  distance: string;
  showtimes: Showtime[];
}

export interface BookingSelection {
  movie: Movie;
  date: ShowDate;
  theater: Theater;
  showtime: Showtime;
}

export type SeatStatus = 'available' | 'selected' | 'unavailable';

export interface Seat {
  id: string; // e.g. "A1", "C5"
  row: string; // e.g. "A"
  number: number; // e.g. 1
  isUnavailable: boolean;
}

export interface SeatRow {
  row: string;
  seats: Seat[];
  category: 'Classic' | 'Prime' | 'Recliner';
}

export type PaymentMethod = 'upi' | 'card' | 'netbanking';

export interface BookingConfirmation {
  bookingRef: string;
  bookingTimestamp: string;
  selection: BookingSelection;
  selectedSeats: string[];
  pricePerSeat: number;
  subtotal: number;
  convenienceFee: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
}
