const express = require('express');
const {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
} = require('../controllers/patientController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES } = require('../config/roles');

const router = express.Router();

// Every patient route requires login.
router.use(protect);

// Viewing patients: any staff role (not the patient role itself — patients
// get a separate "my records" endpoint in a future iteration).
router.get(
  '/',
  authorize(ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTIONIST),
  getPatients
);

router.get(
  '/:id',
  authorize(ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTIONIST),
  getPatientById
);

// Registering/updating patients: front-desk and clinical staff, not just admin.
router.post(
  '/',
  authorize(ROLES.ADMIN, ROLES.RECEPTIONIST, ROLES.NURSE),
  createPatient
);

router.put(
  '/:id',
  authorize(ROLES.ADMIN, ROLES.RECEPTIONIST, ROLES.NURSE, ROLES.DOCTOR),
  updatePatient
);

// Deleting a patient record: admin only.
router.delete('/:id', authorize(ROLES.ADMIN), deletePatient);

module.exports = router;
