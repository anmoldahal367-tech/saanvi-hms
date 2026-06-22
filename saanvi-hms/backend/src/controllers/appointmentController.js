const { Appointment, Patient, User } = require('../models');
const { ROLES } = require('../config/roles');

// Shared eager-load config so every response includes readable patient/doctor
// names instead of just raw UUIDs.
const include = [
  { model: Patient, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'phone'] },
  { model: User, as: 'doctor', attributes: ['id', 'name', 'email'] },
];

// GET /api/appointments
// Behavior differs by role:
//   - admin/receptionist: see everything
//   - nurse: see everything, read-only (enforced at the route level)
//   - doctor: only their own appointments
//   - patient: only appointments tied to their own Patient profile
async function getAppointments(req, res, next) {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const where = {};

    if (status) {
      where.status = status;
    }

    if (req.user.role === ROLES.DOCTOR) {
      where.doctorId = req.user.id;
    }

    if (req.user.role === ROLES.PATIENT) {
      const myPatient = await Patient.findOne({ where: { userId: req.user.id } });
      if (!myPatient) {
        // No linked patient profile yet — nothing to show, but not an error.
        return res.json({ appointments: [], total: 0, page: Number(page), totalPages: 0 });
      }
      where.patientId = myPatient.id;
    }

    const { count, rows } = await Appointment.findAndCountAll({
      where,
      include,
      limit: Number(limit),
      offset,
      order: [['scheduledAt', 'DESC']],
    });

    res.json({
      appointments: rows,
      total: count,
      page: Number(page),
      totalPages: Math.ceil(count / Number(limit)),
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/appointments/doctors
// Lightweight list of doctors for populating a "choose a doctor" dropdown
// when booking. Available to anyone who can reach the booking form.
async function getDoctors(req, res, next) {
  try {
    const doctors = await User.findAll({
      where: { role: ROLES.DOCTOR, isActive: true },
      attributes: ['id', 'name', 'email'],
      order: [['name', 'ASC']],
    });
    res.json({ doctors });
  } catch (err) {
    next(err);
  }
}

// POST /api/appointments
// - receptionist/admin: must supply patientId explicitly (booking on behalf of someone)
// - patient: books for themselves automatically, using their own linked Patient profile
async function createAppointment(req, res, next) {
  try {
    const { doctorId, scheduledAt, durationMinutes, reason } = req.body;
    let { patientId } = req.body;

    if (!doctorId || !scheduledAt) {
      return res.status(400).json({ message: 'Doctor and scheduled date/time are required' });
    }

    if (req.user.role === ROLES.PATIENT) {
      const myPatient = await Patient.findOne({ where: { userId: req.user.id } });
      if (!myPatient) {
        return res.status(400).json({
          message: 'No patient profile is linked to your account yet. Please contact the front desk.',
        });
      }
      patientId = myPatient.id;
    }

    if (!patientId) {
      return res.status(400).json({ message: 'patientId is required' });
    }

    const doctor = await User.findOne({ where: { id: doctorId, role: ROLES.DOCTOR } });
    if (!doctor) {
      return res.status(400).json({ message: 'Selected doctor was not found' });
    }

    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(400).json({ message: 'Selected patient was not found' });
    }

    const appointment = await Appointment.create({
      patientId,
      doctorId,
      scheduledAt,
      durationMinutes,
      reason,
      bookedBy: req.user.id,
    });

    const full = await Appointment.findByPk(appointment.id, { include });
    res.status(201).json({ appointment: full });
  } catch (err) {
    next(err);
  }
}

// PUT /api/appointments/:id
// - admin/receptionist: can change date/time, doctor, reason, status
// - doctor: can only update status/notes on their OWN appointments (enforced below)
async function updateAppointment(req, res, next) {
  try {
    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (req.user.role === ROLES.DOCTOR) {
      if (appointment.doctorId !== req.user.id) {
        return res.status(403).json({ message: "You can only update your own appointments" });
      }
      // Doctors are restricted to status/notes — they can't reassign a slot
      // to a different doctor or silently move it to a different time.
      const { status, notes } = req.body;
      await appointment.update({ status, notes });
    } else if (req.user.role === ROLES.PATIENT) {
      // Patients may only cancel their own upcoming appointment, nothing else.
      const myPatient = await Patient.findOne({ where: { userId: req.user.id } });
      if (!myPatient || appointment.patientId !== myPatient.id) {
        return res.status(403).json({ message: 'You can only update your own appointments' });
      }
      if (req.body.status !== 'cancelled') {
        return res.status(403).json({ message: 'You can only cancel your own appointments' });
      }
      await appointment.update({ status: 'cancelled' });
    } else {
      await appointment.update(req.body);
    }

    const full = await Appointment.findByPk(appointment.id, { include });
    res.json({ appointment: full });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/appointments/:id
// Cancelling is the normal path (status update); this is a hard delete,
// reserved for admin to clean up mistaken bookings entirely.
async function deleteAppointment(req, res, next) {
  try {
    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    await appointment.destroy();
    res.json({ message: 'Appointment deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAppointments,
  getDoctors,
  createAppointment,
  updateAppointment,
  deleteAppointment,
};
