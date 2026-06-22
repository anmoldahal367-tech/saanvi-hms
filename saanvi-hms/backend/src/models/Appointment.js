const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Appointment = sequelize.define('Appointment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  patientId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  doctorId: {
    // References a User with role = 'doctor'. Kept as a plain UUID column
    // (not a strict FK constraint to a role-filtered subset) since Postgres
    // foreign keys can't enforce "must be a doctor" — that check happens
    // in the controller instead.
    type: DataTypes.UUID,
    allowNull: false,
  },
  scheduledAt: {
    // Combined date + time of the appointment.
    type: DataTypes.DATE,
    allowNull: false,
  },
  durationMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 30,
  },
  reason: {
    // Short free-text note from whoever books it, e.g. "Follow-up checkup".
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'scheduled',
  },
  notes: {
    // Doctor's notes added after the appointment, e.g. diagnosis/follow-up.
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // Tracks which staff user created the booking (null if the patient self-booked).
  bookedBy: {
    type: DataTypes.UUID,
    allowNull: true,
  },
}, {
  tableName: 'appointments',
});

module.exports = Appointment;
