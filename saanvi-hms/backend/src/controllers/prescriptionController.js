const { Prescription, Appointment, Patient, User } = require('../models');
const { ROLES } = require('../config/roles');
const { notify } = require('../utils/notificationHelper');

const include = [
  {
    model: Appointment,
    as: 'appointment',
    include: [
      { model: Patient, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'dateOfBirth', 'bloodGroup', 'phone'] },
      { model: User, as: 'doctor', attributes: ['id', 'name', 'email'] },
    ],
  },
  { model: User, as: 'prescriber', attributes: ['id', 'name'] },
];

// GET /api/prescriptions/appointment/:appointmentId
// Fetch the prescription for a specific appointment (if one exists).
async function getPrescriptionByAppointment(req, res, next) {
  try {
    const prescription = await Prescription.findOne({
      where: { appointmentId: req.params.appointmentId },
      include,
    });

    if (!prescription) {
      return res.status(404).json({ message: 'No prescription found for this appointment' });
    }

    res.json({ prescription });
  } catch (err) {
    next(err);
  }
}

// GET /api/prescriptions/patient/:patientId
// All prescriptions for a patient — used when generating the full PDF record.
async function getPatientPrescriptions(req, res, next) {
  try {
    const prescriptions = await Prescription.findAll({
      include: [
        {
          model: Appointment,
          as: 'appointment',
          where: { patientId: req.params.patientId },
          include: [
            { model: User, as: 'doctor', attributes: ['id', 'name'] },
          ],
        },
        { model: User, as: 'prescriber', attributes: ['id', 'name'] },
      ],
      order: [[{ model: Appointment, as: 'appointment' }, 'scheduledAt', 'DESC']],
    });

    res.json({ prescriptions });
  } catch (err) {
    next(err);
  }
}

// POST /api/prescriptions
// Create a prescription for an appointment. Only doctor/admin can do this,
// and only for appointments that don't already have one.
async function createPrescription(req, res, next) {
  try {
    const { appointmentId, medicines, generalInstructions } = req.body;

    if (!appointmentId || !medicines || medicines.length === 0) {
      return res.status(400).json({ message: 'appointmentId and at least one medicine are required' });
    }

    const appointment = await Appointment.findByPk(appointmentId, {
      include: [
        { model: Patient, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'userId'] },
        { model: User, as: 'doctor', attributes: ['id', 'name'] },
      ],
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Doctor can only prescribe for their own appointments.
    if (req.user.role === ROLES.DOCTOR && appointment.doctorId !== req.user.id) {
      return res.status(403).json({ message: 'You can only write prescriptions for your own appointments' });
    }

    const existing = await Prescription.findOne({ where: { appointmentId } });
    if (existing) {
      return res.status(409).json({ message: 'A prescription already exists for this appointment. Use PUT to update it.' });
    }

    const prescription = await Prescription.create({
      appointmentId,
      medicines,
      generalInstructions,
      prescribedBy: req.user.id,
    });

    const full = await Prescription.findByPk(prescription.id, { include });

    // Notify the patient a prescription has been written for them.
    if (appointment.patient?.userId) {
      await notify(
        appointment.patient.userId,
        'prescription_added',
        `Dr. ${appointment.doctor?.name} has written a prescription for your recent visit`,
        { prescriptionId: prescription.id, appointmentId }
      );
    }

    res.status(201).json({ prescription: full });
  } catch (err) {
    next(err);
  }
}

// PUT /api/prescriptions/:id
// Update an existing prescription (doctor/admin only).
async function updatePrescription(req, res, next) {
  try {
    const prescription = await Prescription.findByPk(req.params.id, {
      include: [{ model: Appointment, as: 'appointment' }],
    });

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Doctor can only edit prescriptions they wrote, for their own appointments.
    if (
      req.user.role === ROLES.DOCTOR &&
      prescription.appointment.doctorId !== req.user.id
    ) {
      return res.status(403).json({ message: 'You can only edit your own prescriptions' });
    }

    const { medicines, generalInstructions } = req.body;
    await prescription.update({ medicines, generalInstructions });

    const full = await Prescription.findByPk(prescription.id, { include });
    res.json({ prescription: full });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPrescriptionByAppointment,
  getPatientPrescriptions,
  createPrescription,
  updatePrescription,
};
