const { Appointment, Patient, User } = require('../models');
const { ROLES } = require('../config/roles');
const { notify, notifyAllAdmins, notifyAllReceptionists } = require('../utils/notificationHelper');

// Shared eager-load config so every response includes readable patient/doctor
// names instead of just raw UUIDs.
const include = [
  { model: Patient, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'phone'] },
  { model: User, as: 'doctor', attributes: ['id', 'name', 'email'] },
];

// GET /api/appointments
async function getAppointments(req, res, next) {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const where = {};

    if (status) where.status = status;

    if (req.user.role === ROLES.DOCTOR) {
      where.doctorId = req.user.id;
    }

    if (req.user.role === ROLES.PATIENT) {
      const myPatient = await Patient.findOne({ where: { userId: req.user.id } });
      if (!myPatient) {
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
    if (!doctor) return res.status(400).json({ message: 'Selected doctor was not found' });

    const patient = await Patient.findByPk(patientId);
    if (!patient) return res.status(400).json({ message: 'Selected patient was not found' });

    const appointment = await Appointment.create({
      patientId, doctorId, scheduledAt, durationMinutes, reason,
      bookedBy: req.user.id,
    });

    const full = await Appointment.findByPk(appointment.id, { include });

    // ── Notifications ─────────────────────────────────────────────────────────
    const patientName = `${patient.firstName} ${patient.lastName}`;
    const apptDate = new Date(scheduledAt).toLocaleString();
    const notifData = { appointmentId: appointment.id };

    // Notify the doctor their schedule has a new booking.
    await notify(
      doctorId,
      'appointment_booked',
      `New appointment booked: ${patientName} on ${apptDate}`,
      notifData
    );

    // Notify the patient (if they have a login account).
    if (patient.userId) {
      await notify(
        patient.userId,
        'appointment_booked',
        `Your appointment with ${doctor.name} is confirmed for ${apptDate}`,
        notifData
      );
    }

    // Notify admin + reception so they always know what's been booked.
    const staffMsg = `Appointment booked: ${patientName} with ${doctor.name} on ${apptDate}`;
    await notifyAllAdmins('appointment_booked', staffMsg, notifData);
    await notifyAllReceptionists('appointment_booked', staffMsg, notifData);

    res.status(201).json({ appointment: full });
  } catch (err) {
    next(err);
  }
}

// PUT /api/appointments/:id
async function updateAppointment(req, res, next) {
  try {
    const appointment = await Appointment.findByPk(req.params.id, { include });
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    const prevStatus = appointment.status;

    if (req.user.role === ROLES.DOCTOR) {
      if (appointment.doctorId !== req.user.id) {
        return res.status(403).json({ message: 'You can only update your own appointments' });
      }
      const { status, notes } = req.body;
      await appointment.update({ status, notes });
    } else if (req.user.role === ROLES.PATIENT) {
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

    // ── Status-change notifications ───────────────────────────────────────────
    const newStatus = full.status;
    if (newStatus !== prevStatus) {
      const patientName = `${full.patient?.firstName} ${full.patient?.lastName}`;
      const doctorName = full.doctor?.name;
      const notifData = { appointmentId: full.id };

      if (newStatus === 'cancelled') {
        // Tell doctor the appointment was cancelled.
        await notify(full.doctorId, 'appointment_cancelled',
          `Appointment with ${patientName} has been cancelled`, notifData);
        // Tell patient (if they have an account) it was cancelled.
        if (full.patient?.userId) {
          await notify(full.patient.userId, 'appointment_cancelled',
            `Your appointment with ${doctorName} has been cancelled`, notifData);
        }
        await notifyAllAdmins('appointment_cancelled',
          `Appointment cancelled: ${patientName} with ${doctorName}`, notifData);
        await notifyAllReceptionists('appointment_cancelled',
          `Appointment cancelled: ${patientName} with ${doctorName}`, notifData);
      }

      if (newStatus === 'completed') {
        // Tell patient their visit is marked done.
        if (full.patient?.userId) {
          await notify(full.patient.userId, 'appointment_completed',
            `Your appointment with ${doctorName} is marked as completed. Check your prescription.`,
            notifData);
        }
      }
    }

    res.json({ appointment: full });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/appointments/:id
async function deleteAppointment(req, res, next) {
  try {
    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
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
