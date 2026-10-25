const nodemailer = require('nodemailer');

let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_PORT === '465',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

// Optional email notification. If SMTP is not configured it only logs to the console.
module.exports = async function sendMail(to, subject, text) {
  if (!transporter) {
    console.log(`[email not sent - SMTP not configured] To: ${to} | Subject: ${subject}`);
    return;
  }
  try {
    await transporter.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to, subject, text });
  } catch (e) {
    console.error('Email failed:', e.message);
  }
};
