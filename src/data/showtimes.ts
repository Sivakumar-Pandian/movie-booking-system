import type { ShowDate, Theater } from '../types/booking';

export const SAMPLE_SHOW_DATES: ShowDate[] = [
  { id: 'd1', label: 'Today', day: '15', month: 'Oct', fullDate: 'Thursday, 15 Oct 2026' },
  { id: 'd2', label: 'Tomorrow', day: '16', month: 'Oct', fullDate: 'Friday, 16 Oct 2026' },
  { id: 'd3', label: 'Sat', day: '17', month: 'Oct', fullDate: 'Saturday, 17 Oct 2026' },
  { id: 'd4', label: 'Sun', day: '18', month: 'Oct', fullDate: 'Sunday, 18 Oct 2026' },
  { id: 'd5', label: 'Mon', day: '19', month: 'Oct', fullDate: 'Monday, 19 Oct 2026' },
];

export const SAMPLE_THEATERS: Theater[] = [
  {
    id: 'th-1',
    name: 'PVR INOX: Forum South Mall, IMAX',
    location: 'Kanakapura Road, Bengaluru',
    distance: '3.2 km away',
    showtimes: [
      { id: 'st-1', time: '10:30 AM', format: 'IMAX 3D', status: 'Available', price: 380 },
      { id: 'st-2', time: '01:45 PM', format: 'IMAX 3D', status: 'Filling Fast', price: 450 },
      { id: 'st-3', time: '05:30 PM', format: '4DX', status: 'Almost Full', price: 520 },
      { id: 'st-4', time: '09:15 PM', format: 'IMAX 3D', status: 'Available', price: 480 },
    ],
  },
  {
    id: 'th-2',
    name: 'Cinépolis: Nexus Grand Screen & VIP',
    location: 'Koramangala, Bengaluru',
    distance: '5.8 km away',
    showtimes: [
      { id: 'st-5', time: '11:15 AM', format: 'Dolby Atmos', status: 'Available', price: 320 },
      { id: 'st-6', time: '02:45 PM', format: '2D', status: 'Available', price: 260 },
      { id: 'st-7', time: '06:30 PM', format: 'Dolby Atmos', status: 'Almost Full', price: 360 },
      { id: 'st-8', time: '10:00 PM', format: 'Dolby Atmos', status: 'Available', price: 340 },
    ],
  },
  {
    id: 'th-3',
    name: 'INOX: Garuda Megaplex',
    location: 'Magrath Road, Bengaluru',
    distance: '7.1 km away',
    showtimes: [
      { id: 'st-9', time: '10:00 AM', format: '2D', status: 'Available', price: 240 },
      { id: 'st-10', time: '01:15 PM', format: '3D', status: 'Available', price: 290 },
      { id: 'st-11', time: '04:45 PM', format: '3D', status: 'Filling Fast', price: 310 },
      { id: 'st-12', time: '08:15 PM', format: '2D', status: 'Available', price: 280 },
    ],
  },
];
