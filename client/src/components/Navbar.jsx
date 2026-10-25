import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const isManager = user && (user.role === 'organizer' || user.role === 'admin');

  // poll for unread notifications every 30 seconds
  useEffect(() => {
    if (!user) return setUnread(0);
    const load = () => api.get('/notifications').then((r) => setUnread(r.data.unread)).catch(() => {});
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar navbar-expand-lg site-nav sticky-top">
      <div className="container">
        <Link className="navbar-brand brand" to="/"><span className="brand-mark" aria-hidden="true" />EventBook</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#nav" aria-label="Toggle menu">
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="nav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item"><NavLink className="nav-link" to="/" end>Events</NavLink></li>
            {user && <li className="nav-item"><NavLink className="nav-link" to="/dashboard">Dashboard</NavLink></li>}
            {user && <li className="nav-item"><NavLink className="nav-link" to="/bookings">My Bookings</NavLink></li>}
            {isManager && <li className="nav-item"><NavLink className="nav-link" to="/manage/events">Manage Events</NavLink></li>}
            {isManager && <li className="nav-item"><NavLink className="nav-link" to="/manage/reports">Reports</NavLink></li>}
            {user && user.role === 'admin' && <li className="nav-item"><NavLink className="nav-link" to="/admin/people">People</NavLink></li>}
          </ul>
          <ul className="navbar-nav align-items-lg-center gap-lg-3">
            {user ? (
              <>
                <li className="nav-item">
                  <Link className="nav-link position-relative" to="/notifications" aria-label={`Notifications, ${unread} unread`}>
                    🔔
                    {unread > 0 && <span className="badge rounded-pill bg-danger position-absolute top-0 start-100 translate-middle bell-badge">{unread}</span>}
                  </Link>
                </li>
                <li className="nav-item d-flex align-items-center gap-2">
                  <span className="avatar" aria-hidden="true">{user.name.charAt(0).toUpperCase()}</span>
                  <span className="small lh-sm"><strong>{user.name}</strong><br /><span className="text-muted">{user.role}</span></span>
                </li>
                <li className="nav-item"><button className="btn btn-outline-secondary btn-sm" onClick={handleLogout}>Logout</button></li>
              </>
            ) : (
              <>
                <li className="nav-item"><Link className="btn btn-outline-primary btn-sm me-2" to="/login">Login</Link></li>
                <li className="nav-item"><Link className="btn btn-primary btn-sm" to="/register">Sign up</Link></li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
