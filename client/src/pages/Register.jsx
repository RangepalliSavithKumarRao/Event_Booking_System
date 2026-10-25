import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api';
import PasswordInput from '../components/PasswordInput';

const RULES = [
  ['At least 8 characters', (p) => p.length >= 8],
  ['An uppercase letter', (p) => /[A-Z]/.test(p)],
  ['A lowercase letter', (p) => /[a-z]/.test(p)],
  ['A number', (p) => /\d/.test(p)],
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', role: 'user' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const allRulesMet = RULES.every(([, test]) => test(form.password));
  const mismatch = form.confirm && form.confirm !== form.password;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    // client-side validation (the server validates again)
    if (!allRulesMet) return setError('Please meet all the password rules.');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    setBusy(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password, role: form.role });
      navigate('/dashboard');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card shadow-sm auth-card" style={{ maxWidth: 520 }}>
      <div className="card-body p-4">
        <h1 className="h3 mb-1">Create your account</h1>
        <p className="text-muted">It takes less than a minute.</p>
        {error && <div className="alert alert-danger py-2" role="alert">{error}</div>}
        <form onSubmit={submit}>
          <div className="mb-3"><label htmlFor="name" className="form-label">Full name</label><input id="name" className="form-control" required autoComplete="name" value={form.name} onChange={set('name')} /></div>
          <div className="mb-3"><label htmlFor="email" className="form-label">Email</label><input id="email" type="email" className="form-control" required autoComplete="email" value={form.email} onChange={set('email')} /></div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <PasswordInput id="password" autoComplete="new-password" value={form.password} onChange={set('password')} />
            <ul className="rules" aria-label="Password rules">
              {RULES.map(([label, test]) => (
                <li key={label} className={test(form.password) ? 'ok' : ''}>{test(form.password) ? '✓' : '○'} {label}</li>
              ))}
            </ul>
          </div>
          <div className="mb-3">
            <label htmlFor="confirm" className="form-label">Confirm password</label>
            <PasswordInput id="confirm" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} />
            {mismatch && <div className="form-text text-danger">Passwords do not match yet.</div>}
          </div>
          <div className="mb-4">
            <label htmlFor="role" className="form-label">I want to</label>
            <select id="role" className="form-select" value={form.role} onChange={set('role')}>
              <option value="user">Book tickets for events (attendee)</option>
              <option value="organizer">Create and manage events (organizer)</option>
            </select>
          </div>
          <button className="btn btn-primary w-100 py-2" disabled={busy}>{busy ? 'Creating account...' : 'Sign up'}</button>
        </form>
        <p className="mt-3 mb-0 small">Already have an account? <Link to="/login">Log in</Link></p>
      </div>
    </div>
  );
}
