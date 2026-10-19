import { useEffect, useState } from 'react';
import { getStoredToken } from '../services/authApi';
import { API_BASE_URL } from '../services/apiConfig';

interface Props { isOpen: boolean; onClose: () => void; }
interface Report { showtime_id: string; movie_title: string; show_date: string; time: string; booked_seats: number; capacity: number; occupancy_percent: number; total_collected: number; }

export function AdminDashboard({ isOpen, onClose }: Props) {
  const [reports, setReports] = useState<Report[]>([]);
  const [message, setMessage] = useState('');
  const [movieJson, setMovieJson] = useState('{"id":"new-movie","title":"New Movie","duration":"2h 0m","language":"English","certification":"UA","poster_url":"https://placehold.co/300x450","genre":["Drama"],"formats":["2D"]}');
  const [showJson, setShowJson] = useState('{"id":"new-show","movie_id":"new-movie","theater_id":"th-1","show_date":"2026-12-01","time":"07:30 PM","format":"2D","price":250}');
  const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken()}` });
  const load = async () => {
    const res = await fetch(`${API_BASE_URL}/api/admin/reports/shows`, { headers: headers() });
    if (res.ok) setReports(await res.json()); else setMessage('Could not load admin reports.');
  };
  useEffect(() => { if (isOpen) void load(); }, [isOpen]);
  if (!isOpen) return null;
  const submit = async (url: string, body: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}${url}`, { method: 'POST', headers: headers(), body });
      const data = await res.json().catch(() => ({}));
      setMessage(res.ok ? 'Saved successfully.' : data.detail || 'Save failed.');
      if (res.ok) void load();
    } catch { setMessage('Invalid JSON or network error.'); }
  };
  return <div className="bookings-modal-overlay" role="dialog" aria-modal="true">
    <div className="bookings-modal-card">
      <div className="bookings-modal-header"><div><span className="bookings-badge">ADMIN</span><h2 className="bookings-title">Cinema Management</h2></div><button className="bookings-close-btn" onClick={onClose}>✕</button></div>
      <div className="bookings-modal-content">
        <p>{message}</p><h3>Show performance</h3>
        {reports.map((r) => <p key={r.showtime_id}><strong>{r.movie_title}</strong> — {r.show_date}, {r.time}: {r.booked_seats}/{r.capacity} ({r.occupancy_percent}%), ₹{r.total_collected}</p>)}
        <h3>Add movie</h3><textarea value={movieJson} onChange={(e) => setMovieJson(e.target.value)} rows={5} style={{ width: '100%' }} /><button className="btn btn-primary" onClick={() => void submit('/api/admin/movies', movieJson)}>Add movie</button>
        <h3>Add showtime</h3><textarea value={showJson} onChange={(e) => setShowJson(e.target.value)} rows={5} style={{ width: '100%' }} /><button className="btn btn-primary" onClick={() => void submit('/api/admin/showtimes', showJson)}>Add showtime</button>
      </div>
    </div>
  </div>;
}
