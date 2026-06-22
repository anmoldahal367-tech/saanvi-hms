const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Verifies the Authorization: Bearer <token> header, loads the matching
// user from the DB, and attaches it to req.user for downstream handlers.
async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, no token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user no longer exists' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: 'This account has been deactivated' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
  }
}

module.exports = { protect };
