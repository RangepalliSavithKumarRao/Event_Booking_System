import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api';
import { fmtDate, fmtPrice } from '../constants';

export default function ManageEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => api.get('/events/mine/list').then((r) => setEvents(r.data)).catch((e) => setError(errMsg(e))).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const remove = async (ev) => {
    if (!window.confirm(`Delete "${ev.title}"? All its bookings will be removed and attendees notified.`)) return;
    try {
      await api.delete(`/events/${ev._id}`);
      load();
    } catch (e) {
      setError(errMsg(e));
    }
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border" /></div>;

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">Manage Events</h2>
        <Link to="/manage/events/new" className="btn btn-primary">+ Add event</Link>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      {events.length === 0 ? (
        <div className="alert alert-info">You have not created any events yet.</div>
      ) : (
        <div className="card shadow-sm"><div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead className="table-light"><tr><th>Title</th><th>Date</th><th>Venue</th><th>Price</th><th>Seats (left / total)</th><th></th></tr></thead>
            <tbody>
              {events.map((e) => (
                <tr key={e._id}>
                  <td><Link to={`/events/${e._id}`}>{e.title}</Link>{new Date(e.date) < new Date() && <span className="badge text-bg-secondary ms-2">past</span>}</td>
                  <td>{fmtDate(e.date)}</td>
                  <td>{e.venue}</td>
                  <td>{fmtPrice(e.price)}</td>
                  <td>{e.availableSeats} / {e.totalSeats}</td>
                  <td className="text-end text-nowrap">
                    <Link className="btn btn-sm btn-outline-secondary me-1" to={`/manage/reports/${e._id}`}>Registrations</Link>
                    <Link className="btn btn-sm btn-outline-primary me-1" to={`/manage/events/${e._id}/edit`}>Edit</Link>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => remove(e)}>Delete</button>
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
