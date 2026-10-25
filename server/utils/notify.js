const Notification = require('../models/Notification');
const sendMail = require('./mailer');

// Creates an in-app notification and (optionally) sends an email
module.exports = async function notify(user, message, type = 'info', emailSubject, link = '') {
  try {
    await Notification.create({ user: user._id, message, type, link });
    if (emailSubject && user.email) await sendMail(user.email, emailSubject, message);
  } catch (e) {
    console.error('Notify failed:', e.message);
  }
};
