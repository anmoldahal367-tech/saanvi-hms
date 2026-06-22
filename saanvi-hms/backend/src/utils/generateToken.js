const jwt = require('jsonwebtoken');

// Signs a JWT carrying just enough info to identify and authorize the user.
// Keep the payload small — full user data is fetched fresh from the DB
// on protected routes, not trusted blindly from the token.
function generateToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

module.exports = { generateToken };
