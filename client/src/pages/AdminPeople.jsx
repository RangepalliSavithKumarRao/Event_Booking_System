import { useEffect, useMemo, useState } from 'react';
import api, { errMsg } from '../api';
import { fmtDate, money } from '../constants';

function Count({ label, value }) {
  return (
    <div className="col-6 col-md">
      <div className="card stat-card shadow-sm h-100"><div className="card-body py-3"><div className="text-muted small">{label}</div><div className="fs-3 fw-bold">{value}</div></div></div>
    </div>
  );
}

export default function AdminPeople() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('users');
  const [orgFilter, setOrgFilter] = useState('all');
  const [q, setQ] = useState('');

  useEffect(() => {
    api.get('/admin/overview').then((r) => setData(r.data)).catch((e) => setError(errMsg(e)));
  }, []);

  // bookings table: filter by organizer and by text
  const rows = useMemo(() => {
    if (!data) return [];
    const t = q.trim().toLowerCase();
    return data.bookings.filter(
      (b) =>
        (orgFilter === 'all' || b.organizer?._id === orgFilter) &&
        (!t || [b.user?.name, b.user?.email, b.event?.title, b.code].some((x) => x && x.toLowerCase().includes(t)))
    );
  }, [data, orgFilter, q]);

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!data) return <div className="skeleton" style={{ height: 260 }} />;
  const { counts } = data;

  const showOrganizerBookings = (id) => { setOrgFilter(id); setQ(''); setTab('bookings'); };

  return (
    <>
      <h2 className="mb-3">People and bookings</h2>
      <div className="row g-3 mb-4">
        <Count label="Attendees" value={counts.users} />
        <Count label="Organizers" value={counts.organizers} />
        <Count label="Admins" value={counts.admins} />
        <Count label="Events" value={counts.events} />
        <Count label="Active bookings" value={counts.bookings} />
      </div>

      <div className="d-flex flex-wrap gap-2 mb-3" role="tablist">
        {[['users', `Users (${counts.users})`], ['organizers', `Organizers (${counts.organizers})`], ['bookings', 'Bookings']].map(([key, label]) => (
          <button key={key} role="tab" aria-selected={tab === key} className={`pill ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      {tab === 'users' && (
        <div className="card shadow-sm"><div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead className="table-light"><tr><th>Name</th><th>Email</th><th>Joined</th><th>Bookings</th><th>Tickets</th><th>Spent</th></tr></thead>
            <tbody>
              {data.users.length === 0 && <tr><td colSpan="6" className="text-muted">No users yet</td></tr>}
              {data.users.map((u) => (
                <tr key={u._id}><td className="fw-semibold">{u.name}</td><td>{u.email}</td><td>{fmtDate(u.createdAt)}</td><td>{u.bookings}</td><td>{u.tickets}</td><td>{money(u.spent)}</td></tr>
              ))}
            </tbody>
          </table>
        </div></div>
      )}

      {tab === 'organizers' && (
        <div className="card shadow-sm"><div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead className="table-light"><tr><th>Name</th><th>Email</th><th>Events</th><th>Bookings received</th><th>Tickets sold</th><th>Revenue</th><th></th></tr></thead>
            <tbody>
              {data.organizers.length === 0 && <tr><td colSpan="7" className="text-muted">No organizers yet</td></tr>}
              {data.organizers.map((o) => (
                <tr key={o._id}>
                  <td className="fw-semibold">{o.name}</td><td>{o.email}</td><td>{o.events}</td><td>{o.bookings}</td><td>{o.tickets}</td><td>{money(o.revenue)}</td>
                  <td className="text-end"><button className="btn btn-sm btn-outline-primary" onClick={() => showOrganizerBookings(o._id)}>See bookings</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></div>
      )}

      {tab === 'bookings' && (
        <>
          <div className="row g-2 mb-3">
            <div className="col-md-5">
              <select className="form-select" value={orgFilter} onChange={(e) => setOrgFilter(e.target.value)} aria-label="Filter by organizer">
                <option value="all">All organizers</option>
                {data.organizers.map((o) => <option key={o._id} value={o._id}>{o.name}</option>)}
              </select>
            </div>
            <div className="col-md-7">
              <input className="form-control" placeholder="Search by attendee, email, event or booking code" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
          <div className="text-muted small mb-2">{rows.length} booking{rows.length === 1 ? '' : 's'}</div>
          <div className="card shadow-sm"><div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead className="table-light"><tr><th>Code</th><th>Attendee</th><th>Event</th><th>Organizer</th><th>Seats</th><th>Amount</th><th>Status</th><th>Booked on</th></tr></thead>
              <tbody>
                {rows.length === 0 && <tr><td colSpan="8" className="text-muted">No bookings match</td></tr>}
                {rows.map((b) => (
                  <tr key={b._id}>
                    <td><code>{b.code}</code></td>
                    <td className="fw-semibold">{b.user?.name}<div className="small text-muted fw-normal">{b.user?.email}</div></td>
                    <td>{b.event?.title}</td>
                    <td>{b.organizer?.name || 'Unknown'}</td>
                    <td>{b.seats}</td>
                    <td>{b.amount === 0 ? 'Free' : money(b.amount)}</td>
                    <td><span className={`status-chip ${b.status === 'cancelled' ? 'cancelled' : ''}`}>{b.status}</span></td>
                    <td>{fmtDate(b.at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></div>
        </>
      )}
    </>
  );
}
