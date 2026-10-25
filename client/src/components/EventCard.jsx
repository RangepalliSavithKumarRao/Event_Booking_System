import { Link } from 'react-router-dom';
import Banner from './Banner';
import SeatBar from './SeatBar';
import { dateParts, fmtPrice } from '../constants';

export default function EventCard({ event }) {
  const { day, mon, time } = dateParts(event.date);
  const left = event.availableSeats;
  const soldOut = left === 0;
  const almost = !soldOut && left / event.totalSeats <= 0.2;

  return (
    <Link to={`/events/${event._id}`} className="event-card">
      <div className="event-media">
        <Banner event={event} height={170} />
        <div className="date-chip" aria-hidden="true"><span className="d">{day}</span><span className="m">{mon}</span></div>
      </div>
      <div className="p-3 d-flex flex-column flex-grow-1">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="tag">{event.category}</span>
          {soldOut && <span className="tag rust">Sold out</span>}
          {almost && <span className="tag gold">Only {left} left</span>}
        </div>
        <h3>{event.title}</h3>
        <div className="small text-muted">{time}</div>
        <div className="small text-muted text-truncate mb-3">{event.venue}</div>
        <div className="mt-auto">
          <SeatBar available={left} total={event.totalSeats} />
          <div className="d-flex justify-content-between align-items-center mt-2">
            <span className="small text-muted">{soldOut ? 'No seats left' : `${left} seats left`}</span>
            <span className="cta">Book now &rarr;</span>
            <strong className="display-font fs-5">{fmtPrice(event.price)}</strong>
          </div>
        </div>
      </div>
    </Link>
  );
}
