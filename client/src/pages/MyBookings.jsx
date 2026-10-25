import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api';
import { fmtDate, money } from '../constants';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () =>
    api.get('/bookings/my').then((r) => setBookings(r.data)).catch((e) => setError(errMsg(e))).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const cancel = async (id) => {
    if (!window.confirm('Cancel this booking? The seats will be released.')) return;
    try {
      await api.put(`/bookings/${id}/cancel`);
      load();
    } catch (e) {
      setError(errMsg(e));
    }
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border" /></div>;

  return (
    <>
      <h2 className="mb-3">My Bookings</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {bookings.length === 0 ? (
        <div className="alert alert-info">You have no bookings yet. <Link to="/">Browse events</Link></div>
      ) : (
        <div className="card shadow-sm"><div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead className="table-light"><tr><th>Booking code</th><th>Event</th><th>Date</th><th>Seats</th><th>Amount</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b._id}>
                  <td><code>{b.bookingCode}</code></td>
                  <td>{b.event ? <Link to={`/events/${b.event._id}`}>{b.event.title}</Link> : 'Event removed'}</td>
                  <td>{b.event ? fmtDate(b.event.date) : '-'}</td>
                  <td>{b.seats}</td>
                  <td>{b.totalAmount === 0 ? 'Free' : money(b.totalAmount)}</td>
                  <td><span className={`badge ${b.status === 'confirmed' ? 'text-bg-success' : 'text-bg-secondary'}`}>{b.status}</span></td>
                  <td className="text-end text-nowrap">
                    <Link className="btn btn-sm btn-outline-primary me-2" to={`/bookings/${b._id}`}>Ticket</Link>
                    {b.status === 'confirmed' && b.event && new Date(b.event.date) > new Date() && (
                      <button className="btn btn-sm btn-outline-danger" onClick={() => cancel(b._id)}>Cancel</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></div>
      )}
    </>
  );
}
