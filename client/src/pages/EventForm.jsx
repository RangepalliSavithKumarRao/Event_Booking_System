import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { errMsg, imgUrl } from '../api';
import { CATEGORIES } from '../constants';

// converts an ISO date to the value format used by <input type="datetime-local">
const toLocalInput = (d) => {
  const dt = new Date(d);
  dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
  return dt.toISOString().slice(0, 16);
};

// earliest value the date picker allows (now, in local time)
const nowLocal = () => toLocalInput(new Date());

const EMPTY = { title: '', description: '', category: 'Conference', venue: '', date: '', price: 0, totalSeats: 50, bannerUrl: '' };

export default function EventForm() {
  const { id } = useParams(); // present when editing
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [currentBanner, setCurrentBanner] = useState('');
  const [originalDate, setOriginalDate] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get(`/events/${id}`).then(({ data }) => {
      setForm({ title: data.title, description: data.description, category: data.category, venue: data.venue, date: toLocalInput(data.date), price: data.price, totalSeats: data.totalSeats, bannerUrl: '' });
      setCurrentBanner(data.banner);
      setOriginalDate(toLocalInput(data.date));
    }).catch((e) => setError(errMsg(e)));
  }, [id]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    // past dates are not allowed (when editing, an untouched date of an old event is left alone)
    if (new Date(form.date) <= new Date() && (!id || form.date !== originalDate)) {
      return setError('Event date and time must be in the future.');
    }
    setBusy(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => k !== 'date' && fd.append(k, v));
      fd.append('date', new Date(form.date).toISOString());
      if (file) fd.append('banner', file);
      if (id) await api.put(`/events/${id}`, fd);
      else await api.post('/events', fd);
      navigate('/manage/events');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-lg-8">
        <div className="card shadow-sm"><div className="card-body p-4">
          <h3 className="mb-3">{id ? 'Edit event' : 'Add new event'}</h3>
          {error && <div className="alert alert-danger py-2">{error}</div>}
          <form onSubmit={submit}>
            <div className="mb-3"><label className="form-label">Event title</label><input className="form-control" required value={form.title} onChange={set('title')} /></div>
            <div className="mb-3"><label className="form-label">Description</label><textarea className="form-control" rows="4" required value={form.description} onChange={set('description')} /></div>
            <div className="row">
              <div className="col-md-6 mb-3"><label className="form-label">Category</label>
                <select className="form-select" value={form.category} onChange={set('category')}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
              <div className="col-md-6 mb-3"><label className="form-label">Date & time</label><input type="datetime-local" className="form-control" required min={id && originalDate && originalDate < nowLocal() ? undefined : nowLocal()} value={form.date} onChange={set('date')} /></div>
            </div>
            <div className="mb-3"><label className="form-label">Venue</label><input className="form-control" required value={form.venue} onChange={set('venue')} /></div>
            <div className="row">
              <div className="col-md-6 mb-3"><label className="form-label">Ticket price (₹) — 0 for free</label><input type="number" min="0" className="form-control" required value={form.price} onChange={set('price')} /></div>
              <div className="col-md-6 mb-3"><label className="form-label">Total seats</label><input type="number" min="1" className="form-control" required value={form.totalSeats} onChange={set('totalSeats')} /></div>
            </div>
            <div className="mb-3">
              <label className="form-label">Banner image (jpg/png, max 2 MB)</label>
              <input type="file" accept="image/*" className="form-control" onChange={(e) => setFile(e.target.files[0] || null)} />
              {currentBanner && !file && <img src={imgUrl(currentBanner)} alt="current banner" className="mt-2 rounded" style={{ height: 80 }} />}
            </div>
            <div className="mb-4">
              <label className="form-label">…or paste an image URL (optional)</label>
              <input className="form-control" placeholder="https://..." value={form.bannerUrl} onChange={set('bannerUrl')} />
            </div>
            <button className="btn btn-primary me-2" disabled={busy}>{busy ? 'Saving...' : id ? 'Update event' : 'Create event'}</button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/manage/events')}>Cancel</button>
          </form>
        </div></div>
      </div>
    </div>
  );
}
