export const CATEGORIES = ['Conference', 'Workshop', 'Concert', 'College Fest', 'Webinar', 'Sports', 'Other'];

export const CATEGORY_COLORS = {
  Conference: '#1f4fd8',
  Workshop: '#0f766e',
  Concert: '#a31d5f',
  'College Fest': '#b45309',
  Webinar: '#5446c4',
  Sports: '#1e8e6b',
  Other: '#475569',
};

export const fmtDate = (d) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
export const fmtPrice = (p) => (p === 0 ? 'Free' : `₹${Number(p).toLocaleString('en-IN')}`);
export const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

// pieces of a date for the ticket stub
export function dateParts(d) {
  const dt = new Date(d);
  return {
    weekday: dt.toLocaleDateString('en-IN', { weekday: 'short' }),
    day: dt.getDate(),
    mon: dt.toLocaleDateString('en-IN', { month: 'short' }),
    time: dt.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }),
  };
}

// "Today", "Tomorrow", "In 5 days"
export function timeUntil(d) {
  const now = new Date();
  const t = new Date(d);
  if (t < now) return 'Event has ended';
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const b = new Date(t.getFullYear(), t.getMonth(), t.getDate());
  const days = Math.round((b - a) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
}
