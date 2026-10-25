const express = require('express');
const mongoose = require('mongoose');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const { protect, authorize } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
router.use(protect, authorize('organizer', 'admin'));

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const toCsv = (rows) => rows.map((r) => r.map(csvCell).join(',')).join('\n');
const sendCsv = (res, filename, rows) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(toCsv(rows));
};

// builds one stats row per event (tickets sold, bookings, revenue, occupancy)
async function buildEventStats(user) {
  const filter = user.role === 'admin' ? {} : { organizer: user._id };
  const events = await Event.find(filter).sort({ date: -1 });
  const agg = await Booking.aggregate([
    { $match: { event: { $in: events.map((e) => e._id) }, status: 'confirmed' } },
    { $group: { _id: '$event', bookings: { $sum: 1 }, ticketsSold: { $sum: '$seats' }, revenue: { $sum: '$totalAmount' } } },
  ]);
  const map = Object.fromEntries(agg.map((a) => [String(a._id), a]));
  return events.map((e) => {
    const a = map[String(e._id)] || { bookings: 0, ticketsSold: 0, revenue: 0 };
    return {
      _id: e._id,
      title: e.title,
      category: e.category,
      date: e.date,
      venue: e.venue,
      totalSeats: e.totalSeats,
      availableSeats: e.availableSeats,
      bookings: a.bookings,
      ticketsSold: a.ticketsSold,
      revenue: a.revenue,
      occupancy: Math.round((a.ticketsSold / e.totalSeats) * 100),
    };
  });
}

// GET /api/reports/events  -> event report (JSON)
router.get(
  '/events',
  asyncHandler(async (req, res) => {
    const events = await buildEventStats(req.user);
    const summary = {
      events: events.length,
      bookings: events.reduce((s, e) => s + e.bookings, 0),
      ticketsSold: events.reduce((s, e) => s + e.ticketsSold, 0),
      revenue: events.reduce((s, e) => s + e.revenue, 0),
    };
    res.json({ summary, events });
  })
);

// GET /api/reports/events/csv  -> event report as CSV download
router.get(
  '/events/csv',
  asyncHandler(async (req, res) => {
    const events = await buildEventStats(req.user);
    const rows = [['Event', 'Category', 'Date', 'Venue', 'Total Seats', 'Seats Left', 'Bookings', 'Tickets Sold', 'Revenue (INR)', 'Occupancy %']];
    events.forEach((e) =>
      rows.push([e.title, e.category, new Date(e.date).toLocaleString('en-IN'), e.venue, e.totalSeats, e.availableSeats, e.bookings, e.ticketsSold, e.revenue, e.occupancy])
    );
    sendCsv(res, 'event-report.csv', rows);
  })
);

async function loadOwnedEvent(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ message: 'Event not found' });
    return null;
  }
  const event = await Event.findById(req.params.id);
  if (!event) {
    res.status(404).json({ message: 'Event not found' });
    return null;
  }
  if (req.user.role !== 'admin' && String(event.organizer) !== String(req.user._id)) {
    res.status(403).json({ message: 'Not your event' });
    return null;
  }
  return event;
}

// GET /api/reports/event/:id  -> registration summary for one event
router.get(
  '/event/:id',
  asyncHandler(async (req, res) => {
    const event = await loadOwnedEvent(req, res);
    if (!event) return;
    const bookings = await Booking.find({ event: event._id }).populate('user', 'name email').sort({ createdAt: -1 });
    const confirmed = bookings.filter((b) => b.status === 'confirmed');
    const ticketsSold = confirmed.reduce((s, b) => s + b.seats, 0);
    res.json({
      event,
      summary: {
        registrations: confirmed.length,
        cancelled: bookings.length - confirmed.length,
        ticketsSold,
        revenue: confirmed.reduce((s, b) => s + b.totalAmount, 0),
        occupancy: Math.round((ticketsSold / event.totalSeats) * 100),
      },
      registrations: bookings,
    });
  })
);

// GET /api/reports/event/:id/csv  -> registration list as CSV download
router.get(
  '/event/:id/csv',
  asyncHandler(async (req, res) => {
    const event = await loadOwnedEvent(req, res);
    if (!event) return;
    const bookings = await Booking.find({ event: event._id }).populate('user', 'name email').sort({ createdAt: -1 });
    const rows = [['Booking Code', 'Name', 'Email', 'Seats', 'Amount (INR)', 'Status', 'Booked On']];
    bookings.forEach((b) =>
      rows.push([b.bookingCode, b.user?.name, b.user?.email, b.seats, b.totalAmount, b.status, new Date(b.createdAt).toLocaleString('en-IN')])
    );
    sendCsv(res, `registrations-${event.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.csv`, rows);
  })
);

module.exports = router;
