// Mirrors backend/src/config/roles.js. Keep these two files in sync —
// the frontend uses this only to decide what to SHOW; the backend's
// copy is what actually enforces access, so a mismatch here is a UX
// bug, not a security hole.
export const ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  NURSE: 'nurse',
  RECEPTIONIST: 'receptionist',
  PATIENT: 'patient',
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Admin',
  [ROLES.DOCTOR]: 'Doctor',
  [ROLES.NURSE]: 'Nurse',
  [ROLES.RECEPTIONIST]: 'Receptionist',
  [ROLES.PATIENT]: 'Patient',
};
