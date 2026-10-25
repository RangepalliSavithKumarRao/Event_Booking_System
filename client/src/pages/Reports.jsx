import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { downloadFile, errMsg } from '../api';
import { fmtDate, money } from '../constants';

export default function Reports() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/reports/events').then((r) => setData(r.data)).catch((e) => setError(errMsg(e)));
  }, []);

  const exportCsv = () => downloadFile('/reports/events/csv', 'event-report.csv').catch((e) => setError(errMsg(e)));

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!data) return <div className="text-center py-5"><div className="spinner-border" /></div>;
  const { summary, events } = data;

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">Event Reports</h2>
        <div className="d-flex gap-2 no-print">
          <button className="btn btn-outline-primary" onClick={exportCsv}>⬇ Download CSV</button>
          <button className="btn btn-outline-secondary" onClick={() => window.print()}>🖨 Print</button>
        </div>
      </div>

      <div className="row g-3 mb-4">
        {[['Events', summary.events], ['Bookings', summary.bookings], ['Tickets sold', summary.ticketsSold], ['Revenue', money(summary.revenue)]].map(([l, v]) => (
          <div className="col-6 col-md-3" key={l}><div className="card stat-card shadow-sm"><div className="card-body py-3"><div className="text-muted small">{l}</div><div className="fs-4 fw-bold">{v}</div></div></div></div>
        ))}
      </div>

      <div className="card shadow-sm"><div className="table-responsive">
        <table className="table align-middle mb-0">
          <thead className="table-light"><tr><th>Event</th><th>Date</th><th>Bookings</th><th>Tickets sold</th><th>Occupancy</th><th>Revenue</th><th className="no-print"></th></tr></thead>
          <tbody>
            {events.length === 0 && <tr><td colSpan="7" className="text-muted">No events yet</td></tr>}
            {events.map((e) => (
              <tr key={e._id}>
                <td>{e.title}<div className="small text-muted">{e.category}</div></td>
                <td>{fmtDate(e.date)}</td>
                <td>{e.bookings}</td>
                <td>{e.ticketsSold} / {e.totalSeats}</td>
                <td style={{ minWidth: 120 }}>
                  <div className="progress" style={{ height: 8 }}><div className="progress-bar" style={{ width: `${e.occupancy}%` }} /></div>
                  <span className="small text-muted">{e.occupancy}%</span>
                </td>
                <td>{money(e.revenue)}</td>
                <td className="no-print"><Link className="btn btn-sm btn-outline-primary" to={`/manage/reports/${e._id}`}>Registrations</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div></div>
    </>
  );
}
