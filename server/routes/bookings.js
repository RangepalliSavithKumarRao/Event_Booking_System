const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const notify = require('../utils/notify');
const { protect, authorize } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
const MAX_SEATS_PER_BOOKING = 10;
const makeCode = () => 'EVT-' + crypto.randomBytes(4).toString('hex').toUpperCase();
const fmtDate = (d) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

// POST /api/bookings   { eventId, seats }
router.post(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const { eventId } = req.body;
    const seats = parseInt(req.body.seats, 10);
    if (!mongoose.isValidObjectId(eventId)) return res.status(400).json({ message: 'Invalid event' });
    if (!seats || seats < 1 || seats > MAX_SEATS_PER_BOOKING)
      return res.status(400).json({ message: `You can book between 1 and ${MAX_SEATS_PER_BOOKING} seats at a time` });

    // TRANSACTION LOGIC: reduce available seats in ONE atomic step, only if enough seats remain.
    // This stops two people booking the last seat at the same time (no overbooking).
    const event = await Event.findOneAndUpdate(
      { _id: eventId, availableSeats: { $gte: seats }, date: { $gte: new Date() } },
      { $inc: { availableSeats: -seats } },
      { new: true }
    );

    if (!event) {
      const exists = await Event.findById(eventId);
      if (!exists) return res.status(404).json({ message: 'Event not found' });
      if (exists.date < new Date()) return res.status(400).json({ message: 'This event has already happened' });
      return res.status(400).json({ message: `Only ${exists.availableSeats} seat(s) left for this event` });
    }

    let booking;
    try {
      booking = await Booking.create({
        user: req.user._id,
        event: event._id,
        seats,
        totalAmount: seats * event.price,
        bookingCode: makeCode(),
      });
    } catch (err) {
      // roll back the seats if the booking could not be saved
      await Event.findByIdAndUpdate(event._id, { $inc: { availableSeats: seats } });
      throw err;
    }

    const msg = `Booking confirmed! ${seats} ticket(s) for "${event.title}" on ${fmtDate(event.date)} at ${event.venue}. Booking code: ${booking.bookingCode}. Total: Rs. ${booking.totalAmount}.`;
    await notify(req.user, msg, 'booking', `Booking confirmed - ${event.title}`, `/bookings/${booking._id}`);

    res.status(201).json(booking);
  })
);

// GET /api/bookings/my
router.get(
  '/my',
  protect,
  asyncHandler(async (req, res) => {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('event', 'title date venue banner category')
      .sort({ createdAt: -1 });
    res.json(bookings);
  })
);

// GET /api/bookings/event/:eventId   (organizer of that event / admin) -> registrations
router.get(
  '/event/:eventId',
  protect,
  authorize('organizer', 'admin'),
  asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (req.user.role !== 'admin' && String(event.organizer) !== String(req.user._id))
      return res.status(403).json({ message: 'Not your event' });
    const bookings = await Booking.find({ event: event._id }).populate('user', 'name email').sort({ createdAt: -1 });
    res.json(bookings);
  })
);

// GET /api/bookings/:id   (booking owner, event organizer or admin)
router.get(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Booking not found' });
    const booking = await Booking.findById(req.params.id).populate('event').populate('user', 'name email');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    const isOwner = String(booking.user._id) === String(req.user._id);
    const isOrganizer = booking.event && String(booking.event.organizer) === String(req.user._id);
    if (!isOwner && !isOrganizer && req.user.role !== 'admin')
      return res.status(403).json({ message: 'You cannot view this booking' });
    res.json(booking);
  })
);

// PUT /api/bookings/:id/cancel
router.put(
  '/:id/cancel',
  protect,
  asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id).populate('event');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (String(booking.user) !== String(req.user._id) && req.user.role !== 'admin')
      return res.status(403).json({ message: 'You cannot cancel this booking' });
    if (booking.status === 'cancelled') return res.status(400).json({ message: 'Booking is already cancelled' });
    if (booking.event.date < new Date()) return res.status(400).json({ message: 'Past events cannot be cancelled' });

    // atomic status change first (prevents double-refund of seats), then return seats
    const updated = await Booking.findOneAndUpdate(
      { _id: booking._id, status: 'confirmed' },
      { status: 'cancelled' },
      { new: true }
    );
    if (!updated) return res.status(400).json({ message: 'Booking is already cancelled' });
    await Event.findByIdAndUpdate(booking.event._id, { $inc: { availableSeats: booking.seats } });

    await notify(
      req.user,
      `Your booking ${booking.bookingCode} for "${booking.event.title}" has been cancelled. ${booking.seats} seat(s) released.`,
      'cancellation',
      'Booking cancelled',
      `/bookings/${booking._id}`
    );
    res.json(updated);
  })
);

module.exports = router;
