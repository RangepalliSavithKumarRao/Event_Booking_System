import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api';
import PasswordInput from '../components/PasswordInput';

const DEMOS = [
  ['Attendee', 'user@eventbook.com', 'User@1234'],
  ['Organizer 1', 'organizer@eventbook.com', 'Organizer@123'],
  ['Organizer 2', 'organizer2@eventbook.com', 'Organizer@123'],
  ['Admin', 'admin@eventbook.com', 'Admin@123'],
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(form.email, form.password);
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card shadow-sm auth-card">
      <div className="card-body p-4">
        <h1 className="h3 mb-1">Welcome back</h1>
        <p className="text-muted">Log in to book tickets and see your dashboard.</p>
        {error && <div className="alert alert-danger py-2" role="alert">{error}</div>}
        <form onSubmit={submit}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email</label>
            <input id="email" type="email" className="form-control" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <PasswordInput id="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <button className="btn btn-primary w-100 py-2" disabled={busy}>{busy ? 'Logging in...' : 'Log in'}</button>
        </form>
        <p className="mt-3 mb-0 small">New here? <Link to="/register">Create an account</Link></p>
        <hr />
        <p className="small text-muted mb-2">Try a demo account (after running the seed script):</p>
        <div className="d-flex flex-wrap gap-2">
          {DEMOS.map(([label, email, password]) => (
            <button key={label} type="button" className="pill" onClick={() => setForm({ email, password })}>{label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
