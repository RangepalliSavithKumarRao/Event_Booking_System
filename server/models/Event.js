const mongoose = require('mongoose');

const CATEGORIES = ['Conference', 'Workshop', 'Concert', 'College Fest', 'Webinar', 'Sports', 'Other'];

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true },
    description: { type: String, required: [true, 'Description is required'] },
    category: { type: String, enum: CATEGORIES, default: 'Other' },
    venue: { type: String, required: [true, 'Venue is required'], trim: true },
    date: { type: Date, required: [true, 'Event date is required'] },
    price: { type: Number, required: true, min: 0, default: 0 },
    totalSeats: { type: Number, required: true, min: 1 },
    availableSeats: { type: Number, required: true, min: 0 },
    banner: { type: String, default: '' },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

eventSchema.index({ date: 1 });

module.exports = mongoose.model('Event', eventSchema);
module.exports.CATEGORIES = CATEGORIES;
