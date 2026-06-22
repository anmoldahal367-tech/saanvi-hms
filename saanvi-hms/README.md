# SAANVI-HMS — Hospital Management System

A starter full-stack project: React frontend + Node/Express backend + PostgreSQL database,
with JWT authentication, role-based access control (RBAC), a role-aware dashboard, and
working Patients and Appointments CRUD modules.

## Stack

- Frontend: React 18 (Vite), React Router v6, Axios — plain CSS (no UI framework), custom
  reusable components
- Backend: Node.js, Express, Sequelize ORM
- Database: PostgreSQL
- Auth: JWT (jsonwebtoken) + bcrypt password hashing

> Note: the brief mentioned "MERN stack" with PostgreSQL. MERN normally implies MongoDB, so
> this project keeps the React/Express/Node parts of MERN and swaps MongoDB for PostgreSQL
> as instructed, using Sequelize instead of Mongoose as the ORM layer.

## Project structure

```
saanvi-hms/
├── backend/
│   ├── src/
│   │   ├── config/        # db connection, role constants
│   │   ├── models/        # Sequelize models (User, Patient, Appointment)
│   │   ├── controllers/   # business logic per route
│   │   ├── routes/        # Express routers
│   │   ├── middleware/    # auth (JWT), rbac (role checks), error handler
│   │   ├── seeders/       # create-db + demo data scripts
│   │   ├── app.js         # Express app setup
│   │   └── server.js      # entry point — connects DB, starts server
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/           # axios instance + per-resource API calls
│   │   ├── components/
│   │   │   ├── common/    # Button, Input, Card, Table, Modal, RoleBadge, StatusBadge, StatCard, Icon
│   │   │   └── layout/    # Sidebar, Navbar, AppLayout
│   │   ├── context/       # AuthContext (session + RBAC helper)
│   │   ├── pages/         # Login, Register, Dashboard, Patients, Appointments, ManageStaff
│   │   │   └── dashboards/# one panel per role, switched in Dashboard.jsx
│   │   ├── routes/        # ProtectedRoute (auth + role guard)
│   │   └── utils/         # roles constants, nav config
│   └── .env.example
└── docker-compose.yml      # spins up local Postgres
```

## Getting started

### 1. Start PostgreSQL

Easiest option — Docker:

```bash
docker compose up -d
```

This starts Postgres on `localhost:5432` with database `saanvi_hms`, user `postgres`,
password `your_postgres_password` (matches `backend/.env.example`).

If you already have Postgres installed locally, just create a database called `saanvi_hms`
and update `backend/.env` to match your credentials instead.

### 2. Backend setup

```bash
cd backend
cp .env.example .env     # edit if your DB credentials differ
npm install
npm run db:create        # creates the saanvi_hms database if it doesn't exist yet
npm run db:seed          # creates tables + 5 demo users (one per role) + demo patients/appointments
npm run dev               # starts the API on http://localhost:5000
```

Demo logins created by the seed script (password for all: `password123`):

| Role         | Email                      |
|--------------|-----------------------------|
| Admin        | admin@saanvi.test           |
| Doctor       | doctor@saanvi.test          |
| Nurse        | nurse@saanvi.test           |
| Receptionist | receptionist@saanvi.test    |
| Patient      | patient@saanvi.test         |

The `patient@saanvi.test` account is linked to its own Patient record (with two seeded
appointments — one upcoming, one completed) so you can log in as a patient and immediately
see real data in "Your recent appointments" and the Appointments page.

### 3. Frontend setup

```bash
cd frontend
cp .env.example .env     # default already points to http://localhost:5000/api
npm install
npm run dev               # starts the app on http://localhost:5173
```

Open `http://localhost:5173`, log in with any demo account above, and the sidebar/dashboard
will adapt automatically to that role.

> **Already had this project running before Appointments was added?** Just restart the
> backend (`npm run dev`) — Sequelize's `sync({ alter: true })` will automatically add the
> new `appointments` table and the `userId` column on `patients`. Then run `npm run db:seed`
> again to link the demo patient account to its own Patient record and seed two demo
> appointments; it's safe to re-run, existing data won't be duplicated.

## How RBAC is implemented

RBAC is enforced at three layers, deliberately redundant — the frontend hides things the
user can't use, but the backend is the real security boundary:

1. **Backend route middleware** (`backend/src/middleware/rbac.js`) — `authorize('admin', 'doctor')`
   sits in front of each route and rejects with `403` if the logged-in user's role isn't in
   the allowed list. This is the actual enforcement; nothing on the frontend can bypass it.
2. **Frontend route guard** (`frontend/src/routes/ProtectedRoute.jsx`) — redirects away from
   pages the current role shouldn't see (e.g. a receptionist hitting `/staff` directly via URL).
3. **Frontend UI** (`Sidebar.jsx`, `Patients.jsx`, `Appointments.jsx`) — only renders nav links
   and action buttons (Add / Edit / Delete / Cancel / Mark done) that the current role is
   actually allowed to use, so the UI never shows a button that would just 403 if clicked.

Role names live in exactly one place on each side — `backend/src/config/roles.js` and
`frontend/src/utils/roles.js` — so adding a new role later means updating two files, not
hunting for hardcoded strings.

## How the Dashboard adapts per role

`frontend/src/pages/Dashboard.jsx` picks a panel component based on `user.role`
(`AdminDashboard`, `DoctorDashboard`, `NurseDashboard`, `ReceptionistDashboard`,
`PatientDashboard`, all in `pages/dashboards/`). Same route, same shell, different content —
this is the core "RBAC Dashboard" requirement.

## Patients CRUD

The first working vertical slice, end-to-end:

- **List** — `GET /api/patients` with search and pagination, viewable by admin/doctor/nurse/receptionist
- **Create** — `POST /api/patients`, allowed for admin/nurse/receptionist
- **Update** — `PUT /api/patients/:id`, allowed for admin/nurse/receptionist/doctor
- **Delete** — `DELETE /api/patients/:id`, admin only

## Appointments CRUD

Links a Patient to a Doctor (a User with role `doctor`) at a specific date/time, with a
status (`scheduled`, `completed`, `cancelled`). Each role gets different behavior, enforced
both in the route middleware (`backend/src/routes/appointmentRoutes.js`) and again inside
the controller for the finer-grained rules:

- **Admin** — full CRUD on every appointment
- **Receptionist** — can book (`POST`), view, and reschedule/cancel (`PUT`) appointments for
  any patient; cannot hard-delete
- **Doctor** — sees only their own appointments (`GET` is automatically filtered by
  `doctorId` in the controller); can update `status`/`notes` on their own appointments only,
  not the date/time or doctor assignment
- **Nurse** — read-only (`GET` only); can see every appointment across all doctors to help
  coordinate the ward, but has no write access at all
- **Patient** — can book (`POST`) for themselves only (the controller automatically resolves
  their own linked Patient profile, ignoring any `patientId` they might send), can view only
  their own appointments, and can only update their own appointment's `status` to `cancelled`
  (no other field, no other patient's record)

### How a logged-in patient is matched to "their" data

A `Patient` row (clinical record: name, DOB, blood group, etc.) is a separate thing from a
`User` row (login account). To make patient self-service work, `Patient` has an optional
`userId` column linking it to the `User` who can log in and see it as their own:

- When someone **self-registers** through `/register` with role `patient`, `authController.js`
  automatically creates a matching `Patient` row and sets `userId` to their new account —
  this is also why the Register form now asks for date of birth, gender, and phone, since
  the Patient record requires them.
- Patients **registered by staff** (via the Patients page) have no `userId` by default — they
  don't have a login account unless they separately register one themselves.
- Every appointment/patient-record query for the `patient` role looks up
  `Patient.findOne({ where: { userId: req.user.id } })` first, then scopes everything to that
  record. If no match is found (e.g. a staff-registered patient who never made their own
  account), they're told to contact the front desk rather than seeing an error.

## "My Records" — the patient dashboard

`frontend/src/pages/dashboards/PatientDashboard.jsx` is the patient's read-only summary view:
it calls the same `/api/appointments` endpoint as the main Appointments page, but because the
backend automatically scopes results for the `patient` role, it only ever shows that patient's
own upcoming and past appointments — no separate "records" endpoint was needed.

The same pattern (model → controller → routes with `authorize(...)` → frontend API call →
page using the reusable `Table`/`Modal`/`Input` components) can be copied again for the next
entity (e.g. a real Manage Staff CRUD, billing, lab results).

## Reusable components

All in `frontend/src/components/common/`:

- `Button` — variants: primary, secondary, danger, ghost; built-in loading state
- `Input` — label + error + hint slots; `as="select"` or `as="textarea"` to reuse for any field type
- `Card` — panel with optional header/title/actions
- `Table` — generic columns/rows table with loading skeletons and empty state
- `Modal` — accessible dialog, closes on Escape/backdrop click
- `RoleBadge` — colored chip for a user's role
- `StatusBadge` — colored chip for an appointment's status (scheduled/completed/cancelled)
- `StatCard` — dashboard metric tile
- `Icon` — small inline SVG icon set (no external icon package dependency)

## What's intentionally not built yet

Natural next steps once this is reviewed: a real Manage Staff CRUD page (currently a
placeholder demonstrating the admin-only route — create doctor/nurse/receptionist logins,
deactivate accounts), appointment reminders/notifications (e.g. email/SMS the day before),
doctor availability/working-hours so double-booking is prevented at the API level, and
billing/lab-results modules following the same model → controller → routes → page pattern.
