const express = require('express');
const {
  getAppointments,
  getDoctors,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES, ALL_ROLES } = require('../config/roles');

const router = express.Router();

// Every appointment route requires login.
router.use(protect);

// Viewing the doctor list (for the "choose a doctor" dropdown when booking):
// anyone who can reach a booking screen needs this, which is everyone
// except... actually nurses don't book, but they might still want to see
// who's available, so leave this open to all authenticated roles.
router.get('/doctors', authorize(...ALL_ROLES), getDoctors);

// Viewing appointments: every role, but the controller itself narrows what
// each role actually sees (own appointments for doctor/patient, everything
// for admin/receptionist/nurse).
router.get('/', authorize(...ALL_ROLES), getAppointments);

// Booking a new appointment: admin/receptionist book for anyone, patients
// book for themselves. Doctors and nurses don't create bookings.
router.post(
  '/',
  authorize(ROLES.ADMIN, ROLES.RECEPTIONIST, ROLES.PATIENT),
  createAppointment
);

// Updating an appointment: admin/receptionist can edit anything, doctors can
// update status/notes on their own appointments, patients can cancel their
// own. Nurses are read-only and excluded entirely.
router.put(
  '/:id',
  authorize(ROLES.ADMIN, ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.PATIENT),
  updateAppointment
);

// Hard-deleting an appointment record: admin only.
router.delete('/:id', authorize(ROLES.ADMIN), deleteAppointment);

module.exports = router;
