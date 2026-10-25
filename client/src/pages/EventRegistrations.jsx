import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { downloadFile, errMsg } from '../api';
import { fmtDate, money } from '../constants';

export default function EventRegistrations() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/reports/event/${id}`).then((r) => setData(r.data)).catch((e) => setError(errMsg(e)));
  }, [id]);

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!data) return <div className="text-center py-5"><div className="spinner-border" /></div>;
  const { event, summary, registrations } = data;

  const exportCsv = () => downloadFile(`/reports/event/${id}/csv`, `registrations-${id}.csv`).catch((e) => setError(errMsg(e)));

  return (
    <>
      <Link to="/manage/reports" className="small no-print">← Back to reports</Link>
      <div className="d-flex justify-content-between align-items-center my-2">
        <div><h2 className="mb-0">{event.title}</h2><div className="text-muted">{fmtDate(event.date)} · {event.venue}</div></div>
        <div className="d-flex gap-2 no-print">
          <button className="btn btn-outline-primary" onClick={exportCsv}>⬇ Download CSV</button>
          <button className="btn btn-outline-secondary" onClick={() => window.print()}>🖨 Print</button>
        </div>
      </div>

      <div className="row g-3 my-2">
        {[['Registrations', summary.registrations], ['Tickets sold', `${summary.ticketsSold} / ${event.totalSeats}`], ['Occupancy', `${summary.occupancy}%`], ['Revenue', money(summary.revenue)], ['Cancelled', summary.cancelled]].map(([l, v]) => (
          <div className="col-6 col-md" key={l}><div className="card stat-card shadow-sm"><div className="card-body py-3"><div className="text-muted small">{l}</div><div className="fs-4 fw-bold">{v}</div></div></div></div>
        ))}
      </div>

      <div className="card shadow-sm mt-3"><div className="table-responsive">
        <table className="table align-middle mb-0">
          <thead className="table-light"><tr><th>Code</th><th>Name</th><th>Email</th><th>Seats</th><th>Amount</th><th>Status</th><th>Booked on</th></tr></thead>
          <tbody>
            {registrations.length === 0 && <tr><td colSpan="7" className="text-muted">No registrations yet</td></tr>}
            {registrations.map((b) => (
              <tr key={b._id}>
                <td><code>{b.bookingCode}</code></td><td>{b.user?.name}</td><td>{b.user?.email}</td><td>{b.seats}</td>
                <td>{b.totalAmount === 0 ? 'Free' : money(b.totalAmount)}</td>
                <td><span className={`badge ${b.status === 'confirmed' ? 'text-bg-success' : 'text-bg-secondary'}`}>{b.status}</span></td>
                <td>{fmtDate(b.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div></div>
    </>
  );
}
