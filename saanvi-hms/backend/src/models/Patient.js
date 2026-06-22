const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Patient = sequelize.define('Patient', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { notEmpty: true },
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { notEmpty: true },
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other'),
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: { isEmail: { msg: 'Must be a valid email' } },
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  bloodGroup: {
    type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'),
    defaultValue: 'unknown',
  },
  // Free-text field for allergies, ongoing conditions, etc.
  medicalNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // Tracks which staff user registered/owns this patient record (optional, for audit).
  registeredBy: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  // Links this patient record to a logged-in User account (role: 'patient').
  // Null for patients registered by front-desk staff who never create their
  // own login. Set automatically when a patient self-registers, so they can
  // immediately see their own appointments/records.
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    unique: true,
  },
}, {
  tableName: 'patients',
});

module.exports = Patient;
