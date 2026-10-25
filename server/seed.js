// Run with:  npm run seed   (inside the server folder)
// WARNING: this clears the users, events, bookings and notifications collections and adds demo data.
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Event = require('./models/Event');
const Booking = require('./models/Booking');
const Notification = require('./models/Notification');

const daysFromNow = (d, hour = 18) => {
  const x = new Date();
  x.setDate(x.getDate() + d);
  x.setHours(hour, 0, 0, 0);
  return x;
};

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected. Clearing old data...');
  await Promise.all([User.deleteMany(), Event.deleteMany(), Booking.deleteMany(), Notification.deleteMany()]);

  const admin = await User.create({ name: 'Admin', email: 'admin@eventbook.com', password: 'Admin@123', role: 'admin' });
  const org1 = await User.create({ name: 'Riya Organizer', email: 'organizer@eventbook.com', password: 'Organizer@123', role: 'organizer' });
  const org2 = await User.create({ name: 'Karan Mehta', email: 'organizer2@eventbook.com', password: 'Organizer@123', role: 'organizer' });
  const u1 = await User.create({ name: 'Aarav Sharma', email: 'user@eventbook.com', password: 'User@1234', role: 'user' });
  const u2 = await User.create({ name: 'Priya Nair', email: 'priya@eventbook.com', password: 'User@1234', role: 'user' });
  const u3 = await User.create({ name: 'Sneha Reddy', email: 'sneha@eventbook.com', password: 'User@1234', role: 'user' });

  const make = (o, seats, organizer) => ({ ...o, totalSeats: seats, availableSeats: seats, organizer: organizer._id });
  const events = await Event.insertMany([
    make({ title: 'TechSummit 2026', category: 'Conference', venue: 'HICC Convention Centre, Hyderabad', date: daysFromNow(10, 9), price: 1499, description: 'A full-day conference on AI, cloud and web development with keynote talks from industry leaders, panel discussions and networking sessions.' }, 300, org1),
    make({ title: 'Full-Stack Web Workshop', category: 'Workshop', venue: 'T-Hub, Hyderabad', date: daysFromNow(5, 10), price: 499, description: 'Hands-on workshop building a MERN stack application from scratch. Laptop required. Certificates for all participants.' }, 60, org2),
    make({ title: 'Sunset Indie Music Night', category: 'Concert', venue: 'Shilpakala Vedika, Hyderabad', date: daysFromNow(14, 19), price: 799, description: 'An open-air evening with the best indie bands in the city. Food stalls and merchandise available.' }, 200, org1),
    make({ title: 'Aarambh College Fest', category: 'College Fest', venue: 'JNTU Campus Ground', date: daysFromNow(21, 11), price: 0, description: 'Three days of cultural events, coding contests, gaming and food. Free entry for all students with a valid ID.' }, 500, org2),
    make({ title: 'Intro to Data Science (Webinar)', category: 'Webinar', venue: 'Online - Zoom link sent after booking', date: daysFromNow(3, 17), price: 0, description: 'A beginner-friendly one-hour webinar covering Python, pandas and how to start a career in data science.' }, 150, org1),
    make({ title: 'City Marathon 5K / 10K', category: 'Sports', venue: 'Necklace Road, Hyderabad', date: daysFromNow(30, 6), price: 299, description: 'Run for fitness and charity! T-shirt, medal and refreshments included in the registration.' }, 400, org2),
    make({ title: 'Startup Pitch Day', category: 'Conference', venue: 'IIIT Hyderabad Auditorium', date: daysFromNow(8, 14), price: 249, description: 'Watch 12 early-stage startups pitch to a panel of investors. Includes a networking tea session.' }, 120, org1),
  ]);

  // demo bookings across both organizers (also reduce the available seats)
  const demo = [
    [u1, events[0], 2], [u1, events[1], 1], [u2, events[0], 3], [u2, events[2], 4], [u1, events[4], 1],
    [u2, events[6], 2], [u3, events[1], 2], [u3, events[3], 4], [u2, events[5], 1], [u3, events[0], 1],
  ];
  let n = 1;
  for (const [user, ev, seats] of demo) {
    const b = await Booking.create({ user: user._id, event: ev._id, seats, totalAmount: seats * ev.price, bookingCode: `EVT-DEMO${String(n++).padStart(4, '0')}` });
    await Event.findByIdAndUpdate(ev._id, { $inc: { availableSeats: -seats } });
    await Notification.create({ user: user._id, type: 'booking', message: `Booking confirmed! ${seats} ticket(s) for "${ev.title}". Booking code: ${b.bookingCode}.`, link: `/bookings/${b._id}` });
  }

  console.log('\nSeed complete. Demo logins:');
  console.log('  Admin      admin@eventbook.com      / Admin@123');
  console.log('  Organizer  organizer@eventbook.com  / Organizer@123   (Riya)');
  console.log('  Organizer  organizer2@eventbook.com / Organizer@123   (Karan)');
  console.log('  User       user@eventbook.com       / User@1234');
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
