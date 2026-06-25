const express = require('express');
const {
  getPrescriptionByAppointment,
  getPatientPrescriptions,
  createPrescription,
  updatePrescription,
} = require('../controllers/prescriptionController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES, ALL_ROLES } = require('../config/roles');

const router = express.Router();
router.use(protect);

// View prescription for a specific appointment — all clinical staff + the patient.
router.get(
  '/appointment/:appointmentId',
  authorize(...ALL_ROLES),
  getPrescriptionByAppointment
);

// All prescriptions for a patient — used by the PDF download and patient history.
router.get(
  '/patient/:patientId',
  authorize(ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTIONIST),
  getPatientPrescriptions
);

// Write a new prescription — doctor and admin only.
router.post(
  '/',
  authorize(ROLES.DOCTOR, ROLES.ADMIN),
  createPrescription
);

// Edit an existing prescription — doctor and admin only.
router.put(
  '/:id',
  authorize(ROLES.DOCTOR, ROLES.ADMIN),
  updatePrescription
);

module.exports = router;
