const express = require('express');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// GET /api/dashboard  -> different data depending on the role
router.get(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const now = new Date();
    const upcomingEvents = await Event.find({ date: { $gte: now } }).sort({ date: 1 }).limit(5);

    // ---------- normal user ----------
    if (req.user.role === 'user') {
      const bookings = await Booking.find({ user: req.user._id }).populate('event', 'title date venue').sort({ createdAt: -1 });
      const confirmed = bookings.filter((b) => b.status === 'confirmed');
      return res.json({
        role: 'user',
        stats: {
          totalBookings: confirmed.length,
          ticketsBought: confirmed.reduce((s, b) => s + b.seats, 0),
          totalSpent: confirmed.reduce((s, b) => s + b.totalAmount, 0),
          cancelled: bookings.length - confirmed.length,
        },
        recentBookings: bookings.slice(0, 5),
        upcomingEvents,
      });
    }

    // ---------- organizer / admin ----------
    const filter = req.user.role === 'admin' ? {} : { organizer: req.user._id };
    const events = await Event.find(filter);
    const ids = events.map((e) => e._id);
    const bookings = await Booking.find({ event: { $in: ids } })
      .populate('user', 'name email')
      .populate('event', 'title category')
      .sort({ createdAt: -1 });
    const confirmed = bookings.filter((b) => b.status === 'confirmed');

    const perEvent = events.map((e) => ({
      name: e.title.length > 18 ? e.title.slice(0, 16) + '…' : e.title,
      booked: e.totalSeats - e.availableSeats,
      available: e.availableSeats,
    }));

    // bookings per day for the last 7 days
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      days.push({ key: d.toDateString(), day: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), bookings: 0 });
    }
    confirmed.forEach((b) => {
      const slot = days.find((x) => x.key === new Date(b.createdAt).toDateString());
      if (slot) slot.bookings += 1;
    });

    const catMap = {};
    confirmed.forEach((b) => {
      const c = b.event?.category || 'Other';
      catMap[c] = (catMap[c] || 0) + b.seats;
    });

    const stats = {
      totalEvents: events.length,
      upcomingEvents: events.filter((e) => e.date >= now).length,
      totalBookings: confirmed.length,
      ticketsSold: confirmed.reduce((s, b) => s + b.seats, 0),
      revenue: confirmed.reduce((s, b) => s + b.totalAmount, 0),
    };
    if (req.user.role === 'admin') stats.totalUsers = await User.countDocuments();

    res.json({
      role: req.user.role,
      stats,
      perEvent,
      byDay: days.map(({ day, bookings: n }) => ({ day, bookings: n })),
      byCategory: Object.entries(catMap).map(([name, value]) => ({ name, value })),
      userActivity: bookings.slice(0, 8).map((b) => ({
        _id: b._id,
        user: b.user?.name,
        event: b.event?.title,
        seats: b.seats,
        status: b.status,
        at: b.createdAt,
      })),
      upcomingEvents,
    });
  })
);

module.exports = router;
