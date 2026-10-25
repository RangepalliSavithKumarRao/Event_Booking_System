# 🎟️ EventBook – Event Booking System 

A full-stack web application to discover, book and manage events.
**Stack:** React (Vite) + Bootstrap · Node.js + Express · MongoDB (Mongoose) · JWT authentication

## Features (mapped to the 5 project modules)

| Module                     | What is implemented                                                                                                                                                                                                                 |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Authentication          | Register, login, logout, password validation (8+ chars, upper/lower/number), bcrypt hashing, JWT session restored on refresh, 3 roles (user / organizer / admin)                                                                    |
| 2. Event management        | Add / edit / delete events, banner upload (or image URL), date, venue, price, seats – organizers manage their own events, admin manages all                                                                                         |
| 3. Ticket booking          | Event listing with search + category filter, choose number of seats, atomic seat reservation (no overbooking), booking code, e-ticket page, cancel booking (seats released)                                                         |
| 4. Dashboard & analytics   | Role-based dashboard: stats cards, booking history, upcoming events, bar / pie / line charts, recent user activity                                                                                                                  |
| 5. Notifications & reports | In-app notifications (bell icon) with direct links to the ticket, event-update alerts to booked users, the organizer and admins, optional email (SMTP), event report, registration summary per event, CSV download, printable pages |

---

## 1. What to install on your laptop (one time)

| Tool                                                            | Why                                                                     | Download                                       |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------- |
| **Node.js (LTS version)**                                       | Runs the backend and the React build. Includes `npm`.                   | https://nodejs.org                             |
| **MongoDB Community Server**                                    | The database                                                            | https://www.mongodb.com/try/download/community |
| **MongoDB Compass** (comes with the installer, tick the option) | A visual tool to see your database tables/data – useful for screenshots | https://www.mongodb.com/try/download/compass   |
| **VS Code**                                                     | Code editor                                                             | https://code.visualstudio.com                  |
| **Git**                                                         | Needed to upload to GitHub                                              | https://git-scm.com                            |

Check the installs by opening a terminal (Command Prompt / PowerShell / Terminal) and typing:

```
node -v
npm -v
git --version
```

MongoDB runs as a background service after installation on Windows. (If you don't want to install MongoDB locally, use the free **MongoDB Atlas** cloud database instead – see section 5 – and put its connection string in `server/.env`.)

---

## 2. Run the project

Open the project folder in VS Code, open the terminal (Ctrl + `) and run these commands **from the project's root folder**:

```bash
# 1) install all dependencies (takes a couple of minutes)
npm run setup

# 2) fill the database with demo data (admin, 2 organizers, 3 users, 7 events, bookings)
npm run seed

# 3) start backend + frontend together
npm run dev
```

Then open **http://localhost:5173** in your browser.

- Backend API runs on http://localhost:5000 (test: http://localhost:5000/api/health)
- The file `server/.env` is already created with working local defaults. If you use MongoDB Atlas, change `MONGO_URI` there.

### Demo accounts (created by `npm run seed`)

| Role                | Email                    | Password      |
| ------------------- | ------------------------ | ------------- |
| Admin               | admin@eventbook.com      | Admin@123     |
| Organizer 1 (Riya)  | organizer@eventbook.com  | Organizer@123 |
| Organizer 2 (Karan) | organizer2@eventbook.com | Organizer@123 |
| User (attendee)     | user@eventbook.com       | User@1234     |

### Common problems

| Problem                     | Fix                                                                                          |
| --------------------------- | -------------------------------------------------------------------------------------------- |
| `MongoDB connection failed` | MongoDB isn't running. On Windows: open _Services_ → start **MongoDB Server**. Or use Atlas. |
| `'npm' is not recognized`   | Install Node.js, then close and re-open the terminal / VS Code.                              |
| Port 5000 already in use    | Change `PORT` in `server/.env` **and** the proxy target in `client/vite.config.js`.          |
| Page loads but no events    | Run `npm run seed`.                                                                          |

---

## 3. How the project is organised

```
event-booking-system/
├── server/                 ← BACKEND (Node + Express + MongoDB)
│   ├── server.js           ← app entry point
│   ├── seed.js             ← demo data script
│   ├── config/db.js        ← MongoDB connection
│   ├── models/             ← database schemas: User, Event, Booking, Notification
│   ├── routes/             ← API: auth, events, bookings, dashboard, reports, notifications
│   ├── middleware/         ← JWT auth + role check, image upload (multer)
│   ├── utils/              ← notifications + email helper
│   └── uploads/            ← uploaded event banners
├── client/                 ← FRONTEND (React + Vite + Bootstrap)
│   └── src/
│       ├── pages/          ← Home, Login, Register, EventDetails, MyBookings, BookingConfirmation,
│       │                     Dashboard, ManageEvents, EventForm, Reports, EventRegistrations, Notifications
│       ├── components/     ← Navbar, EventCard, Banner, ProtectedRoute
│       ├── context/        ← AuthContext (login state)
│       └── api.js          ← axios setup
└── docs/DATABASE_SCHEMA.md ← database schema (deliverable)
```

### API summary

| Method & URL                                 | Access           | Purpose                                           |
| -------------------------------------------- | ---------------- | ------------------------------------------------- |
| POST `/api/auth/register`, `/api/auth/login` | public           | create account / log in (returns JWT)             |
| GET `/api/auth/me`                           | logged in        | restore session                                   |
| GET `/api/events` (`?search=&category=`)     | public           | list upcoming events                              |
| GET `/api/events/:id`                        | public           | event details                                     |
| POST / PUT / DELETE `/api/events`            | organizer, admin | create / update / delete event                    |
| POST `/api/bookings`                         | logged in        | book tickets `{eventId, seats}`                   |
| GET `/api/bookings/my`, `/api/bookings/:id`  | logged in        | booking history / ticket                          |
| PUT `/api/bookings/:id/cancel`               | owner, admin     | cancel booking                                    |
| GET `/api/dashboard`                         | logged in        | role-based stats + chart data                     |
| GET `/api/reports/events` (+`/csv`)          | organizer, admin | event report                                      |
| GET `/api/reports/event/:id` (+`/csv`)       | organizer, admin | registration summary                              |
| GET `/api/notifications`, PUT `/read-all`    | logged in        | notifications (with links to tickets / events)    |
| GET `/api/admin/overview`                    | admin            | all users, organizers and who booked whose events |

### How "no overbooking" works (transaction logic)

When a user books, the server runs one atomic MongoDB update:
`findOneAndUpdate({ _id, availableSeats: { $gte: seats } }, { $inc: { availableSeats: -seats } })`.
If two people try to take the last seat together, only one update succeeds. If saving the booking fails afterwards, the seats are rolled back. Cancelling marks the booking cancelled and returns the seats.

---

## 4. Optional: email notifications

Fill `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` in `server/.env` (for Gmail use smtp.gmail.com, port 587 and an _App Password_). If left empty, emails are only printed in the server console and the in-app notifications still work.

---

## 5. Deployment – single link for the whole app

The Express server also serves the built React app, so you only deploy **once** on Render.

**Cloud database (MongoDB Atlas, free)**

1. Create an account at https://www.mongodb.com/atlas → create a free **M0** cluster.
2. _Database Access_ → add a user (username + password, no special characters).
3. _Network Access_ → **Add IP address → Allow access from anywhere (0.0.0.0/0)**.
4. _Connect → Drivers_ → copy the connection string, e.g.
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/event_booking?retryWrites=true&w=majority`
5. (Optional) Fill Atlas with demo data: put this string as `MONGO_URI` in your local `server/.env`, run `npm run seed`, then change it back.
