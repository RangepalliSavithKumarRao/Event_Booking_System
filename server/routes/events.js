const express = require('express');
const mongoose = require('mongoose');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const User = require('../models/User');
const notify = require('../utils/notify');
const upload = require('../middleware/upload');
const { protect, authorize } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');


const IST = { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' };

// list what changed between the old and the new version of an event
function describeChanges(b, a) {
  const out = [];
  if (b.title !== a.title) out.push(`title changed to "${a.title}"`);
  if (new Date(b.date).getTime() !== new Date(a.date).getTime())
    out.push(`date changed from ${new Date(b.date).toLocaleString('en-IN', IST)} to ${new Date(a.date).toLocaleString('en-IN', IST)}`);
  if (b.venue !== a.venue) out.push(`venue changed from "${b.venue}" to "${a.venue}"`);
  if (b.price !== a.price) out.push(`ticket price changed from Rs. ${b.price} to Rs. ${a.price}`);
  if (b.category !== a.category) out.push(`category changed to ${a.category}`);
  if (b.totalSeats !== a.totalSeats) out.push(`capacity changed from ${b.totalSeats} to ${a.totalSeats} seats`);
  if (b.description !== a.description) out.push('description updated');
  if (b.banner !== a.banner) out.push('banner image updated');
  return out;
}

// tell the organizer, every admin and everyone with a confirmed booking about the update
async function notifyEventUpdate(event, changes, actor) {
  const summary = changes.join('; ');
  const link = `/events/${event._id}`;
  const seen = new Set();
  const send = async (u, msg) => {
    if (!u || seen.has(String(u._id))) return;
    seen.add(String(u._id));
    await notify(u, msg, 'event', `Event updated: ${event.title}`, link);
  };

  const organizer = await User.findById(event.organizer);
  const admins = await User.find({ role: 'admin' });
  const byOther = organizer && String(actor._id) !== String(organizer._id);

  await send(organizer, byOther ? `${actor.name} (${actor.role}) updated your event "${event.title}": ${summary}.` : `You updated "${event.title}": ${summary}.`);
  for (const a of admins) await send(a, `Event "${event.title}" (organizer: ${organizer ? organizer.name : 'unknown'}) was updated by ${actor.name}: ${summary}.`);

  const bookings = await Booking.find({ event: event._id, status: 'confirmed' }).populate('user');
  for (const b of bookings)
    await send(b.user, `The event "${event.title}" that you booked was updated: ${summary}. Your booking ${b.bookingCode} is still valid.`);
}

// GET /api/events?search=&category=&upcoming=true   (public)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { search, category, upcoming } = req.query;
    const q = {};
    if (search) {
      const rx = new RegExp(escapeRegex(search), 'i');
      q.$or = [{ title: rx }, { venue: rx }, { description: rx }];
    }
    if (category && category !== 'All') q.category = category;
    if (upcoming !== 'false') q.date = { $gte: new Date() };
    const events = await Event.find(q).sort({ date: 1 });
    res.json(events);
  })
);

// GET /api/events/mine/list  -> events the logged-in organizer/admin can manage
router.get(
  '/mine/list',
  protect,
  authorize('organizer', 'admin'),
  asyncHandler(async (req, res) => {
    const filter = req.user.role === 'admin' ? {} : { organizer: req.user._id };
    const events = await Event.find(filter).sort({ date: -1 });
    res.json(events);
  })
);

// GET /api/events/:id   (public)
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Event not found' });
    const event = await Event.findById(req.params.id).populate('organizer', 'name');
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  })
);

function readEventBody(req) {
  const { title, description, category, venue, date, price, totalSeats, bannerUrl } = req.body;
  const data = { title, description, category, venue, date, price: Number(price), totalSeats: Number(totalSeats) };
  if (req.file) data.banner = `/uploads/${req.file.filename}`;
  else if (bannerUrl) data.banner = bannerUrl;
  return data;
}

function validateEventData(d) {
  if (!d.title || !d.description || !d.venue || !d.date) return 'Title, description, venue and date are required';
  if (isNaN(new Date(d.date).getTime())) return 'Invalid date';
  if (!Number.isFinite(d.price) || d.price < 0) return 'Price must be 0 or more';
  if (!Number.isInteger(d.totalSeats) || d.totalSeats < 1) return 'Total seats must be a whole number of at least 1';
  return null;
}

// POST /api/events   (organizer/admin)
router.post(
  '/',
  protect,
  authorize('organizer', 'admin'),
  upload.single('banner'),
  asyncHandler(async (req, res) => {
    const data = readEventBody(req);
    const problem = validateEventData(data);
    if (problem) return res.status(400).json({ message: problem });
    if (new Date(data.date) <= new Date())
      return res.status(400).json({ message: 'Event date and time must be in the future' });
    const event = await Event.create({ ...data, availableSeats: data.totalSeats, organizer: req.user._id });
    res.status(201).json(event);
  })
);

// PUT /api/events/:id   (owner organizer or admin)
router.put(
  '/:id',
  protect,
  authorize('organizer', 'admin'),
  upload.single('banner'),
  asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (req.user.role !== 'admin' && String(event.organizer) !== String(req.user._id))
      return res.status(403).json({ message: 'You can only edit your own events' });

    const data = readEventBody(req);
    const problem = validateEventData(data);
    if (problem) return res.status(400).json({ message: problem });
    const dateChanged = new Date(data.date).getTime() !== event.date.getTime();
    if (dateChanged && new Date(data.date) <= new Date())
      return res.status(400).json({ message: 'Event date and time must be in the future' });

    // Keep seat maths correct when the total is changed
    const booked = event.totalSeats - event.availableSeats;
    if (data.totalSeats < booked)
      return res.status(400).json({ message: `${booked} seats are already booked, total seats cannot be lower than that` });
    data.availableSeats = data.totalSeats - booked;
    if (!data.banner) delete data.banner; // keep the old banner if nothing new was supplied

    const before = event.toObject();
    Object.assign(event, data);
    await event.save();

    const changes = describeChanges(before, event);
    if (changes.length) await notifyEventUpdate(event, changes, req.user);
    res.json(event);
  })
);

// DELETE /api/events/:id   (owner organizer or admin)
router.delete(
  '/:id',
  protect,
  authorize('organizer', 'admin'),
  asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (req.user.role !== 'admin' && String(event.organizer) !== String(req.user._id))
      return res.status(403).json({ message: 'You can only delete your own events' });

    // tell people who had confirmed bookings, then remove the event and its bookings
    const bookings = await Booking.find({ event: event._id, status: 'confirmed' }).populate('user');
    for (const b of bookings) {
      await notify(b.user, `The event "${event.title}" was cancelled by the organizer. Your booking ${b.bookingCode} is void.`, 'event', 'Event cancelled');
    }
    await Booking.deleteMany({ event: event._id });
    await event.deleteOne();
    res.json({ message: 'Event deleted' });
  })
);

module.exports = router;
