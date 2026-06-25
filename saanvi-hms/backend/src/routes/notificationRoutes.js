const express = require('express');
const { getNotifications, markAllRead, markOneRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/', getNotifications);
router.put('/read-all', markAllRead);
router.put('/:id/read', markOneRead);

module.exports = router;
