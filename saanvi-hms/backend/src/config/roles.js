// Single source of truth for role names used across the whole app.
// Import this instead of typing role strings directly, so a typo
// like 'recptionist' can't silently break access control.
const ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  NURSE: 'nurse',
  RECEPTIONIST: 'receptionist',
  PATIENT: 'patient',
};

const ALL_ROLES = Object.values(ROLES);

module.exports = { ROLES, ALL_ROLES };
