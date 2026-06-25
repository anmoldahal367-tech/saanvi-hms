const { Notification } = require('../models');

// GET /api/notifications
// Returns all notifications for the logged-in user, newest first.
// The frontend polls this every 30 seconds to keep the bell icon fresh.
async function getNotifications(req, res, next) {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    res.json({ notifications, unreadCount });
  } catch (err) {
    next(err);
  }
}

// PUT /api/notifications/read-all
// Marks every unread notification for this user as read.
// Called when the user opens the notification dropdown.
async function markAllRead(req, res, next) {
  try {
    await Notification.update(
      { isRead: true },
      { where: { userId: req.user.id, isRead: false } }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
}

// PUT /api/notifications/:id/read
// Mark a single notification as read.
async function markOneRead(req, res, next) {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    await notification.update({ isRead: true });
    res.json({ notification });
  } catch (err) {
    next(err);
  }
}

module.exports = { getNotifications, markAllRead, markOneRead };
