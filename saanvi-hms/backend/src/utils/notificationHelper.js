const { Notification, User } = require('../models');
const { ROLES } = require('../config/roles');

// Creates a notification for one specific user.
async function notify(userId, type, message, data = {}) {
  try {
    await Notification.create({ userId, type, message, data });
  } catch (err) {
    // Notifications are non-critical — log but never crash the main request.
    console.error('Failed to create notification:', err.message);
  }
}

// Notifies all admins in the system. Used for events staff should always
// know about (e.g. a patient self-books or cancels).
async function notifyAllAdmins(type, message, data = {}) {
  try {
    const admins = await User.findAll({
      where: { role: ROLES.ADMIN, isActive: true },
      attributes: ['id'],
    });
    await Promise.all(admins.map((a) => notify(a.id, type, message, data)));
  } catch (err) {
    console.error('Failed to notify admins:', err.message);
  }
}

// Notifies all receptionists. Used alongside notifyAllAdmins for
// front-desk-relevant events like a new booking.
async function notifyAllReceptionists(type, message, data = {}) {
  try {
    const staff = await User.findAll({
      where: { role: ROLES.RECEPTIONIST, isActive: true },
      attributes: ['id'],
    });
    await Promise.all(staff.map((s) => notify(s.id, type, message, data)));
  } catch (err) {
    console.error('Failed to notify receptionists:', err.message);
  }
}

module.exports = { notify, notifyAllAdmins, notifyAllReceptionists };
