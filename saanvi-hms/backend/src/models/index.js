const sequelize = require('../config/db');
const User = require('./User');
const Patient = require('./Patient');
const Appointment = require('./Appointment');
const Prescription = require('./Prescription');
const Notification = require('./Notification');

// ── Patient ↔ User ────────────────────────────────────────────────────────────
User.hasMany(Patient, { foreignKey: 'registeredBy', as: 'registeredPatients' });
Patient.belongsTo(User, { foreignKey: 'registeredBy', as: 'registrar', onDelete: 'SET NULL' });

User.hasOne(Patient, { foreignKey: 'userId', as: 'patientProfile', onDelete: 'SET NULL' });
Patient.belongsTo(User, { foreignKey: 'userId', as: 'account' });

// ── Appointment ↔ Patient / Doctor ────────────────────────────────────────────
Patient.hasMany(Appointment, { foreignKey: 'patientId', as: 'appointments', onDelete: 'CASCADE' });
Appointment.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });

User.hasMany(Appointment, { foreignKey: 'doctorId', as: 'doctorAppointments', onDelete: 'CASCADE' });
Appointment.belongsTo(User, { foreignKey: 'doctorId', as: 'doctor' });

// ── Prescription ↔ Appointment / Doctor ───────────────────────────────────────
Appointment.hasOne(Prescription, { foreignKey: 'appointmentId', as: 'prescription', onDelete: 'CASCADE' });
Prescription.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });

User.hasMany(Prescription, { foreignKey: 'prescribedBy', as: 'prescriptions', onDelete: 'SET NULL' });
Prescription.belongsTo(User, { foreignKey: 'prescribedBy', as: 'prescriber' });

// ── Notification ↔ User ───────────────────────────────────────────────────────
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'recipient' });

module.exports = {
  sequelize,
  User,
  Patient,
  Appointment,
  Prescription,
  Notification,
};
