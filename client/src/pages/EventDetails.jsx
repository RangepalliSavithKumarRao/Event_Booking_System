import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import Banner from '../components/Banner';
import SeatBar from '../components/SeatBar';
import { fmtDate, fmtPrice, money, timeUntil } from '../constants';

export default function EventDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [seats, setSeats] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get(`/events/${id}`).then((r) => setEvent(r.data)).catch((e) => setError(errMsg(e))).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="skeleton" style={{ height: 380 }} />;
  if (!event) return <div className="alert alert-danger">{error || 'Event not found'} <Link to="/">Back to events</Link></div>;

  const past = new Date(event.date) < new Date();
  const soldOut = event.availableSeats === 0;
  const maxSeats = Math.min(10, event.availableSeats);
  const safeSeats = Math.min(seats, Math.max(maxSeats, 1));

  const book = async () => {
    if (!user) return navigate('/login', { state: { from: `/events/${id}` } });
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/bookings', { eventId: event._id, seats: safeSeats });
      navigate(`/bookings/${data._id}`, { state: { justBooked: true } });
    } catch (e) {
      setError(errMsg(e));
      // refresh the seat count in case someone else booked meanwhile
      api.get(`/events/${id}`).then((r) => setEvent(r.data)).catch(() => {});
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Link to="/" className="small">&larr; All events</Link>
      <div className="row g-4 mt-1">
        <div className="col-lg-8">
          <Banner event={event} height={300} rounded />
          <div className="d-flex flex-wrap align-items-center gap-2 mt-4 mb-2">
            <span className="tag">{event.category}</span>
            {!past && <span className="tag gold">{timeUntil(event.date)}</span>}
          </div>
          <h1 className="h2">{event.title}</h1>

          <dl className="facts my-4">
            <dt>When</dt><dd>{fmtDate(event.date)}</dd>
            <dt>Where</dt><dd>{event.venue}</dd>
            {event.organizer?.name && (<><dt>Hosted by</dt><dd>{event.organizer.name}</dd></>)}
          </dl>

          <h2 className="h5">About this event</h2>
          <p style={{ whiteSpace: 'pre-line', maxWidth: '68ch' }}>{event.description}</p>
        </div>

        <div className="col-lg-4">
          <div className="book-panel sticky-top" style={{ top: 84 }}>
            <div className="head">
              <div className="price">{fmtPrice(event.price)}</div>
              <div className="small" style={{ color: '#c5cee0' }}>{event.price === 0 ? 'No payment needed' : 'per ticket'}</div>
            </div>
            <div className="p-3">
              <SeatBar available={event.availableSeats} total={event.totalSeats} />
              <p className="small mt-2 mb-3">
                {soldOut ? <strong className="text-danger">Sold out</strong> : <><strong>{event.availableSeats}</strong> of {event.totalSeats} seats left</>}
              </p>

              {error && <div className="alert alert-danger py-2" role="alert">{error}</div>}

              {past ? (
                <div className="alert alert-secondary mb-0">This event has already taken place.</div>
              ) : soldOut ? (
                <button className="btn btn-secondary w-100" disabled>Sold out</button>
              ) : (
                <>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span id="seat-label" className="fw-semibold">Seats</span>
                    <div className="stepper" role="group" aria-labelledby="seat-label">
                      <button type="button" onClick={() => setSeats(Math.max(1, safeSeats - 1))} disabled={safeSeats <= 1} aria-label="Fewer seats">&minus;</button>
                      <output aria-live="polite">{safeSeats}</output>
                      <button type="button" onClick={() => setSeats(Math.min(maxSeats, safeSeats + 1))} disabled={safeSeats >= maxSeats} aria-label="More seats">+</button>
                    </div>
                  </div>
                  <div className="d-flex justify-content-between mb-3 pt-3 border-top">
                    <span>Total</span>
                    <strong className="display-font fs-5">{event.price === 0 ? 'Free' : money(safeSeats * event.price)}</strong>
                  </div>
                  <button className="btn btn-primary w-100 py-2" onClick={book} disabled={busy}>
                    {busy ? 'Booking...' : user ? 'Confirm booking' : 'Log in to book'}
                  </button>
                  <p className="small text-muted mt-2 mb-0">Up to 10 seats per booking. Demo project, no real payment is taken.</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
