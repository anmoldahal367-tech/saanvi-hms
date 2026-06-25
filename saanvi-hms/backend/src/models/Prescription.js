const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// A Prescription belongs to one Appointment. One prescription can have
// multiple medicine items stored as a JSONB array, so you don't need a
// separate PrescriptionItem table for a project at this scale.
const Prescription = sequelize.define('Prescription', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  appointmentId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true, // one prescription per appointment
  },
  // Array of { medicine, dosage, frequency, duration, notes }
  // e.g. [{ medicine: "Paracetamol", dosage: "500mg", frequency: "Twice daily", duration: "5 days", notes: "After food" }]
  medicines: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
  },
  // General instructions from the doctor to the patient.
  generalInstructions: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // Who wrote this prescription (User id, must be doctor or admin).
  prescribedBy: {
    type: DataTypes.UUID,
    allowNull: false,
  },
}, {
  tableName: 'prescriptions',
});

module.exports = Prescription;
