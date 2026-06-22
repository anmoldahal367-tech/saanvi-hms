import { ROLES } from '../utils/roles';

// Each item declares which roles can see it. The Sidebar filters this
// list against the current user's role — this is the "RBAC Dashboard"
// behavior: the same shell, different menu depending on who's logged in.
export const NAV_ITEMS = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    roles: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTIONIST, ROLES.PATIENT],
    icon: 'grid',
  },
  {
    label: 'Patients',
    path: '/patients',
    roles: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTIONIST],
    icon: 'users',
  },
  {
    label: 'Appointments',
    path: '/appointments',
    roles: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTIONIST, ROLES.PATIENT],
    icon: 'calendar',
  },
  {
    label: 'Manage Staff',
    path: '/staff',
    roles: [ROLES.ADMIN],
    icon: 'shield',
  },
];
