const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    seats: { type: Number, required: true, min: 1 },
    totalAmount: { type: Number, required: true, min: 0 },
    bookingCode: { type: String, required: true, unique: true },
    status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
  },
  { timestamps: true }
);

bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ event: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
