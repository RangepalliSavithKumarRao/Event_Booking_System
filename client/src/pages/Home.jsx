import { useEffect, useMemo, useState } from 'react';
import api, { errMsg } from '../api';
import EventCard from '../components/EventCard';
import { CATEGORIES } from '../constants';

export default function Home() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('date');
  const [freeOnly, setFreeOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // re-fetch when the search text or category changes (300ms debounce)
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get('/events', { params: { search, category } });
        setEvents(data);
        setError('');
      } catch (e) {
        setError(errMsg(e));
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [search, category]);

  // sorting and the "free only" switch happen in the browser
  const visible = useMemo(() => {
    let list = freeOnly ? events.filter((e) => e.price === 0) : [...events];
    if (sort === 'price-asc') list.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);
    if (sort === 'seats') list.sort((a, b) => b.availableSeats - a.availableSeats);
    return list;
  }, [events, sort, freeOnly]);

  const reset = () => { setSearch(''); setCategory('All'); setFreeOnly(false); setSort('date'); };

  return (
    <>
      <section className="hero-block">
        <h1>Book your seat before it is gone</h1>
        <p>Conferences, workshops, concerts and college fests. Pick an event, choose your seats and get your ticket in seconds.</p>
        <label className="search-ticket">
          <span className="visually-hidden">Search events</span>
          <input type="search" placeholder="Search by event, venue or keyword" value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
      </section>

      <div className="d-flex flex-wrap gap-2 mb-3" role="group" aria-label="Filter by category">
        {['All', ...CATEGORIES].map((c) => (
          <button key={c} className={`pill ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)} aria-pressed={category === c}>{c}</button>
        ))}
      </div>

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div className="text-muted">{loading ? 'Loading events...' : `${visible.length} event${visible.length === 1 ? '' : 's'} found`}</div>
        <div className="d-flex align-items-center gap-3">
          <div className="form-check form-switch mb-0">
            <input className="form-check-input" type="checkbox" role="switch" id="freeOnly" checked={freeOnly} onChange={(e) => setFreeOnly(e.target.checked)} />
            <label className="form-check-label" htmlFor="freeOnly">Free only</label>
          </div>
          <select className="form-select form-select-sm" style={{ width: 'auto' }} value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort events">
            <option value="date">Soonest first</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="seats">Most seats left</option>
          </select>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="row g-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <div className="col-12 col-md-6 col-xl-4" key={i}><div className="skeleton" /></div>)}
        </div>
      ) : visible.length === 0 ? (
        <div className="empty-state">
          <div className="big" aria-hidden="true">🎫</div>
          <h4>No events match your search</h4>
          <p className="text-muted">Try another keyword, or clear the filters.</p>
          <button className="btn btn-primary" onClick={reset}>Clear filters</button>
        </div>
      ) : (
        <div className="row g-4">
          {visible.map((e) => (
            <div className="col-12 col-md-6 col-xl-4" key={e._id}><EventCard event={e} /></div>
          ))}
        </div>
      )}
    </>
  );
}
