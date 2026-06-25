const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// In-app notifications. Each notification targets one User (the recipient).
// The `type` field drives the icon/color shown in the UI.
// `data` is a flexible JSONB blob carrying context (e.g. appointment id,
// patient name) so the notification message can be rendered on the frontend
// without an extra DB lookup.
const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    // The user who should see this notification.
    type: DataTypes.UUID,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM(
      'appointment_booked',
      'appointment_cancelled',
      'appointment_completed',
      'prescription_added'
    ),
    allowNull: false,
  },
  message: {
    // Human-readable text, e.g. "Your appointment with Dr. Asha Rai has been booked."
    type: DataTypes.STRING,
    allowNull: false,
  },
  // Extra context for rendering (appointment id, patient name, etc.)
  data: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'notifications',
});

module.exports = Notification;
