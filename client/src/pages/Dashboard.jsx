import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { fmtDate, money } from '../constants';

const COLORS = ['#0369a1', '#38bdf8', '#075985', '#7dd3fc', '#0ea5e9', '#0c4a6e', '#94a3b8'];

function Stat({ label, value, color = '#0369a1' }) {
  return (
    <div className="col-6 col-lg">
      <div className="card stat-card shadow-sm h-100" style={{ borderLeftColor: color }}>
        <div className="card-body py-3">
          <div className="text-muted small">{label}</div>
          <div className="fs-3 fw-bold">{value}</div>
        </div>
      </div>
    </div>
  );
}

function UpcomingList({ events }) {
  return (
    <div className="card shadow-sm h-100">
      <div className="card-header bg-white fw-bold">Upcoming events</div>
      <ul className="list-group list-group-flush">
        {events.length === 0 && <li className="list-group-item text-muted">No upcoming events</li>}
        {events.map((e) => (
          <li key={e._id} className="list-group-item d-flex justify-content-between">
            <Link to={`/events/${e._id}`}>{e.title}</Link>
            <span className="small text-muted">{fmtDate(e.date)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard').then((r) => setData(r.data)).catch((e) => setError(errMsg(e)));
  }, []);

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!data) return <div className="text-center py-5"><div className="spinner-border" /></div>;

  // ---------- attendee dashboard ----------
  if (data.role === 'user') {
    const s = data.stats;
    return (
      <>
        <h2 className="mb-3">Welcome back, {user.name} 👋</h2>
        <div className="row g-3 mb-4">
          <Stat label="Active bookings" value={s.totalBookings} />
          <Stat label="Tickets bought" value={s.ticketsBought} color="#38bdf8" />
          <Stat label="Total spent" value={money(s.totalSpent)} color="#0ea5e9" />
          <Stat label="Cancelled" value={s.cancelled} color="#64748b" />
        </div>
        <div className="row g-4">
          <div className="col-lg-7">
            <div className="card shadow-sm h-100">
              <div className="card-header bg-white fw-bold d-flex justify-content-between">Booking history <Link to="/bookings" className="small">View all</Link></div>
              <ul className="list-group list-group-flush">
                {data.recentBookings.length === 0 && <li className="list-group-item text-muted">No bookings yet</li>}
                {data.recentBookings.map((b) => (
                  <li key={b._id} className="list-group-item d-flex justify-content-between align-items-center">
                    <div><Link to={`/bookings/${b._id}`}>{b.event?.title || 'Event removed'}</Link><div className="small text-muted">{b.seats} seat(s) · {fmtDate(b.createdAt)}</div></div>
                    <span className={`badge ${b.status === 'confirmed' ? 'text-bg-success' : 'text-bg-secondary'}`}>{b.status}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="col-lg-5"><UpcomingList events={data.upcomingEvents} /></div>
        </div>
      </>
    );
  }

  // ---------- organizer / admin dashboard ----------
  const s = data.stats;
  return (
    <>
      <h2 className="mb-3">{user.role === 'admin' ? 'Admin' : 'Organizer'} Dashboard</h2>
      <div className="row g-3 mb-4">
        <Stat label="Total events" value={s.totalEvents} />
        <Stat label="Upcoming events" value={s.upcomingEvents} color="#0ea5e9" />
        <Stat label="Bookings" value={s.totalBookings} color="#38bdf8" />
        <Stat label="Tickets sold" value={s.ticketsSold} color="#075985" />
        <Stat label="Revenue" value={money(s.revenue)} color="#0ea5e9" />
        {s.totalUsers !== undefined && <Stat label="Registered users" value={s.totalUsers} color="#0c4a6e" />}
      </div>

      <div className="row g-4 mb-4">
        <div className="col-lg-7">
          <div className="card shadow-sm"><div className="card-header bg-white fw-bold">Seats booked per event</div>
            <div className="card-body" style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.perEvent}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={11} interval={0} angle={-15} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} />
                  <Tooltip /><Legend />
                  <Bar dataKey="booked" name="Booked" stackId="a" fill="#0369a1" />
                  <Bar dataKey="available" name="Available" stackId="a" fill="#bae6fd" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="col-lg-5">
          <div className="card shadow-sm"><div className="card-header bg-white fw-bold">Tickets by category</div>
            <div className="card-body" style={{ height: 300 }}>
              {data.byCategory.length === 0 ? <p className="text-muted">No bookings yet</p> : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.byCategory} dataKey="value" nameKey="name" outerRadius={95} label>
                      {data.byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip /><Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-6">
          <div className="card shadow-sm"><div className="card-header bg-white fw-bold">Bookings in the last 7 days</div>
            <div className="card-body" style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.byDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" fontSize={12} /><YAxis allowDecimals={false} /><Tooltip />
                  <Line type="monotone" dataKey="bookings" stroke="#0ea5e9" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card shadow-sm h-100"><div className="card-header bg-white fw-bold">Recent user activity</div>
            <ul className="list-group list-group-flush">
              {data.userActivity.length === 0 && <li className="list-group-item text-muted">No activity yet</li>}
              {data.userActivity.map((a) => (
                <li key={a._id} className="list-group-item small">
                  <strong>{a.user}</strong> booked {a.seats} seat(s) for <em>{a.event}</em>{' '}
                  {a.status === 'cancelled' && <span className="badge text-bg-secondary">cancelled</span>}
                  <div className="text-muted">{fmtDate(a.at)}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
