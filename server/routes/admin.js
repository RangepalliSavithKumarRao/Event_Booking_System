const express = require('express');
const User = require('../models/User');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const { protect, authorize } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
router.use(protect, authorize('admin'));

const slim = (u) => (u ? { _id: u._id, name: u.name, email: u.email } : null);

// GET /api/admin/overview -> all users, all organizers and who booked which organizer's events
router.get(
  '/overview',
  asyncHandler(async (req, res) => {
    const [users, events, bookings] = await Promise.all([
      User.find().select('-password').sort({ createdAt: -1 }),
      Event.find(),
      Booking.find().populate('user', 'name email').populate('event', 'title date organizer').sort({ createdAt: -1 }),
    ]);

    const userMap = Object.fromEntries(users.map((u) => [String(u._id), u]));
    const valid = bookings.filter((b) => b.event && b.user);
    const confirmed = valid.filter((b) => b.status === 'confirmed');

    // per attendee totals
    const spend = {};
    confirmed.forEach((b) => {
      const k = String(b.user._id);
      spend[k] = spend[k] || { bookings: 0, tickets: 0, spent: 0 };
      spend[k].bookings += 1; spend[k].tickets += b.seats; spend[k].spent += b.totalAmount;
    });

    // per organizer totals
    const org = {};
    events.forEach((e) => {
      const k = String(e.organizer);
      org[k] = org[k] || { events: 0, bookings: 0, tickets: 0, revenue: 0 };
      org[k].events += 1;
    });
    confirmed.forEach((b) => {
      const k = String(b.event.organizer);
      org[k] = org[k] || { events: 0, bookings: 0, tickets: 0, revenue: 0 };
      org[k].bookings += 1; org[k].tickets += b.seats; org[k].revenue += b.totalAmount;
    });

    const withRole = (role, stats) =>
      users.filter((u) => u.role === role).map((u) => ({ ...slim(u), role: u.role, createdAt: u.createdAt, ...(stats[String(u._id)] || {}) }));

    res.json({
      counts: {
        users: users.filter((u) => u.role === 'user').length,
        organizers: users.filter((u) => u.role === 'organizer').length,
        admins: users.filter((u) => u.role === 'admin').length,
        events: events.length,
        bookings: confirmed.length,
      },
      users: withRole('user', spend).map((u) => ({ bookings: 0, tickets: 0, spent: 0, ...u })),
      organizers: withRole('organizer', org).map((u) => ({ events: 0, bookings: 0, tickets: 0, revenue: 0, ...u })),
      admins: withRole('admin', {}),
      bookings: valid.map((b) => ({
        _id: b._id,
        code: b.bookingCode,
        user: slim(b.user),
        event: { _id: b.event._id, title: b.event.title, date: b.event.date },
        organizer: slim(userMap[String(b.event.organizer)]),
        seats: b.seats,
        amount: b.totalAmount,
        status: b.status,
        at: b.createdAt,
      })),
    });
  })
);

module.exports = router;
