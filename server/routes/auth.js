const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const EMAIL_RULE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '7d' });
const userPayload = (u) => ({ _id: u._id, name: u.name, email: u.email, role: u.role });

// POST /api/auth/register
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });
    if (!EMAIL_RULE.test(email)) return res.status(400).json({ message: 'Please enter a valid email address' });
    if (!PASSWORD_RULE.test(password))
      return res
        .status(400)
        .json({ message: 'Password must be at least 8 characters and include an uppercase letter, a lowercase letter and a number' });

    if (await User.findOne({ email: email.toLowerCase() }))
      return res.status(400).json({ message: 'An account with this email already exists' });

    // Only "user" or "organizer" can be chosen at sign-up. Admins are created via the seed script.
    const safeRole = role === 'organizer' ? 'organizer' : 'user';
    const user = await User.create({ name, email, password, role: safeRole });
    res.status(201).json({ token: signToken(user._id), user: userPayload(user) });
  })
);

// POST /api/auth/login
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });
    res.json({ token: signToken(user._id), user: userPayload(user) });
  })
);

// GET /api/auth/me  (used to restore the session on page refresh)
router.get('/me', protect, (req, res) => res.json({ user: userPayload(req.user) }));

module.exports = router;
