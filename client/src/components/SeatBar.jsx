// Small progress bar showing how full an event is
export default function SeatBar({ available, total }) {
  const pct = total ? Math.round(((total - available) / total) * 100) : 0;
  const cls = available === 0 ? 'full' : available / total <= 0.2 ? 'low' : '';
  return (
    <div className={`seatbar ${cls}`} role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100" aria-label="Seats booked">
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}
