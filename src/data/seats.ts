import type { SeatRow, Seat } from '../types/booking';

// Realistic sample unavailable/booked seats
const UNAVAILABLE_SEATS_SET = new Set([
  'A5', 'A6',
  'B3', 'B4', 'B8',
  'C7', 'C8',
  'D5', 'D6', 'D7',
  'E1', 'E2', 'E9',
  'F4', 'F5',
]);

const ROW_CONFIG: { row: string; count: number; category: 'Classic' | 'Prime' | 'Recliner' }[] = [
  { row: 'A', count: 10, category: 'Recliner' },
  { row: 'B', count: 10, category: 'Prime' },
  { row: 'C', count: 10, category: 'Prime' },
  { row: 'D', count: 10, category: 'Classic' },
  { row: 'E', count: 10, category: 'Classic' },
  { row: 'F', count: 10, category: 'Classic' },
];

export const generateSampleSeatingLayout = (): SeatRow[] => {
  return ROW_CONFIG.map(({ row, count, category }) => {
    const seats: Seat[] = [];
    for (let num = 1; num <= count; num++) {
      const seatId = `${row}${num}`;
      seats.push({
        id: seatId,
        row,
        number: num,
        isUnavailable: UNAVAILABLE_SEATS_SET.has(seatId),
      });
    }
    return {
      row,
      category,
      seats,
    };
  });
};

export const INITIAL_SEAT_LAYOUT = generateSampleSeatingLayout();
