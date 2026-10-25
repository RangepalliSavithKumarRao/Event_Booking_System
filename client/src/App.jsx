import { Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import EventDetails from './pages/EventDetails';
import MyBookings from './pages/MyBookings';
import BookingConfirmation from './pages/BookingConfirmation';
import Dashboard from './pages/Dashboard';
import Notifications from './pages/Notifications';
import ManageEvents from './pages/ManageEvents';
import EventForm from './pages/EventForm';
import Reports from './pages/Reports';
import EventRegistrations from './pages/EventRegistrations';
import AdminPeople from './pages/AdminPeople';

const MANAGERS = ['organizer', 'admin'];

export default function App() {
  return (
    <>
      <Navbar />
      <div className="container py-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/events/:id" element={<EventDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
          <Route path="/bookings/:id" element={<ProtectedRoute><BookingConfirmation /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

          <Route path="/manage/events" element={<ProtectedRoute roles={MANAGERS}><ManageEvents /></ProtectedRoute>} />
          <Route path="/manage/events/new" element={<ProtectedRoute roles={MANAGERS}><EventForm /></ProtectedRoute>} />
          <Route path="/manage/events/:id/edit" element={<ProtectedRoute roles={MANAGERS}><EventForm /></ProtectedRoute>} />
          <Route path="/manage/reports" element={<ProtectedRoute roles={MANAGERS}><Reports /></ProtectedRoute>} />
          <Route path="/manage/reports/:id" element={<ProtectedRoute roles={MANAGERS}><EventRegistrations /></ProtectedRoute>} />

          <Route path="/admin/people" element={<ProtectedRoute roles={['admin']}><AdminPeople /></ProtectedRoute>} />

          <Route path="*" element={<div className="text-center py-5"><h2>404 - Page not found</h2><Link to="/">Go home</Link></div>} />
        </Routes>
      </div>
      <footer className="site-footer"><div className="slogan">Your seat. Your story. One tap away.</div><div className="sub">EventBook: where every great moment begins with a ticket.</div></footer>
    </>
  );
}
