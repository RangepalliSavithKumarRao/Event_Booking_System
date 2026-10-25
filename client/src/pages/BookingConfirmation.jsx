import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import api, { errMsg } from '../api';
import Barcode from '../components/Barcode';
import { fmtDate, money } from '../constants';

export default function BookingConfirmation() {
  const { id } = useParams();
  const location = useLocation();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/bookings/${id}`).then((r) => setBooking(r.data)).catch((e) => setError(errMsg(e)));
  }, [id]);

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!booking) return <div className="skeleton" style={{ height: 320 }} />;
  const ev = booking.event;
  const cancelled = booking.status === 'cancelled';

  return (
    <div className="mx-auto" style={{ maxWidth: 820 }}>
      {location.state?.justBooked && (
        <div className="alert alert-success no-print" role="status">
          <strong>You are booked.</strong> Your confirmation is in your notifications, and emailed if email is set up.
        </div>
      )}

      <article className="eticket shadow-sm" aria-label="E-ticket">
        <div className="main">
          <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
            <div>
              <div className="label">Admit {booking.seats} {booking.seats === 1 ? 'person' : 'people'}</div>
              <h1 className="h3 mb-0">{ev?.title}</h1>
            </div>
            <span className={`status-chip ${cancelled ? 'cancelled' : ''}`}>{booking.status}</span>
          </div>
          <div className="row g-3">
            <div className="col-sm-6"><div className="label">Date and time</div><div className="fw-semibold">{ev && fmtDate(ev.date)}</div></div>
            <div className="col-sm-6"><div className="label">Venue</div><div className="fw-semibold">{ev?.venue}</div></div>
            <div className="col-sm-6"><div className="label">Attendee</div><div className="fw-semibold">{booking.user?.name}</div><div className="small text-muted">{booking.user?.email}</div></div>
            <div className="col-sm-6"><div className="label">Total</div><div className="fw-semibold">{booking.totalAmount === 0 ? 'Free' : money(booking.totalAmount)}</div></div>
          </div>
          <div className="label mt-3">Booked on {fmtDate(booking.createdAt)}</div>
        </div>
        <div className="side">
          <div className="label">Booking code</div>
          <div className="code mb-3">{booking.bookingCode}</div>
          <div style={{ color: 'var(--ink)', opacity: cancelled ? 0.3 : 1 }}><Barcode value={booking.bookingCode} /></div>
          <div className="label mt-3">{booking.seats} seat(s)</div>
        </div>
      </article>

      <div className="mt-3 d-flex flex-wrap gap-2 no-print">
        <button className="btn btn-primary" onClick={() => window.print()}>Print or save as PDF</button>
        <Link to="/bookings" className="btn btn-outline-secondary">My bookings</Link>
        <Link to="/" className="btn btn-outline-secondary">Browse more events</Link>
      </div>
    </div>
  );
}
