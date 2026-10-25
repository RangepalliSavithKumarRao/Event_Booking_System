import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api';
import { fmtDate } from '../constants';

const ICONS = { booking: '✅', cancellation: '❌', event: '📢', info: 'ℹ️' };
const LINK_LABEL = { booking: 'View ticket', cancellation: 'View booking', event: 'View event' };

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/notifications').then((r) => setItems(r.data.notifications)).catch((e) => setError(errMsg(e))).finally(() => setLoading(false));
  }, []);

  const markAll = async () => {
    await api.put('/notifications/read-all');
    setItems(items.map((n) => ({ ...n, read: true })));
  };

  if (loading) return <div className="skeleton" style={{ height: 200 }} />;

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">Notifications</h2>
        {items.some((n) => !n.read) && <button className="btn btn-sm btn-outline-primary" onClick={markAll}>Mark all as read</button>}
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      {items.length === 0 ? (
        <div className="alert alert-info">No notifications yet.</div>
      ) : (
        <ul className="list-group shadow-sm">
          {items.map((n) => (
            <li key={n._id} className={`list-group-item note-item ${n.read ? '' : 'unread'}`}>
              <div>{ICONS[n.type]} {n.message}</div>
              <div className="d-flex justify-content-between align-items-center mt-1">
                <span className="small text-muted">{fmtDate(n.createdAt)}</span>
                {n.link && <Link className="btn btn-sm btn-primary" to={n.link}>{LINK_LABEL[n.type] || 'Open'} &rarr;</Link>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
