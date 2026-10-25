const express = require('express');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// GET /api/notifications
router.get(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
    const unread = await Notification.countDocuments({ user: req.user._id, read: false });
    res.json({ notifications, unread });
  })
);

// PUT /api/notifications/read-all
router.put(
  '/read-all',
  protect,
  asyncHandler(async (req, res) => {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.json({ message: 'All notifications marked as read' });
  })
);

module.exports = router;
