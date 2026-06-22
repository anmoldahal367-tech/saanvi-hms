const { User, Patient } = require('../models');
const { generateToken } = require('../utils/generateToken');
const { ALL_ROLES, ROLES } = require('../config/roles');

// POST /api/auth/register
// Open registration defaults new accounts to 'patient'. Staff accounts
// (admin/doctor/nurse/receptionist) should be created by an admin via
// the user management screen, not through public self-signup.
async function register(req, res, next) {
  try {
    const { name, email, password, role, dateOfBirth, gender, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    // Only allow role to be set here if it's a valid role; otherwise default kicks in.
    const safeRole = ALL_ROLES.includes(role) ? role : undefined;

    const user = await User.create({ name, email, password, role: safeRole });

    // A self-registering patient needs a matching Patient record so they
    // have something to attach appointments to and a profile to view.
    // Staff roles (admin/doctor/nurse/receptionist) skip this entirely.
    if (user.role === ROLES.PATIENT) {
      if (!dateOfBirth || !gender || !phone) {
        // Roll back the user so we don't leave a patient account with no
        // patient profile attached — better to fail the whole signup than
        // half-create it.
        await user.destroy();
        return res.status(400).json({
          message: 'Date of birth, gender, and phone are required to complete patient registration',
        });
      }

      const [firstName, ...rest] = name.trim().split(' ');
      const lastName = rest.join(' ') || firstName;

      await Patient.create({
        firstName,
        lastName,
        dateOfBirth,
        gender,
        phone,
        email,
        userId: user.id,
      });
    }

    const token = generateToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'This account has been deactivated' });
    }

    const token = generateToken(user);
    res.json({ user, token });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me
// Returns the currently logged-in user, based on the token (req.user
// is set by the `protect` middleware). Used by the frontend on app load
// to restore the session.
async function getMe(req, res) {
  res.json({ user: req.user });
}

module.exports = { register, login, getMe };
