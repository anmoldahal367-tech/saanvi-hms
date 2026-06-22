import { ROLE_LABELS } from '../../utils/roles';
import './RoleBadge.css';

/** Small colored chip showing a user's role, e.g. in the navbar or a user table. */
export default function RoleBadge({ role }) {
  return <span className={`role-badge role-badge--${role}`}>{ROLE_LABELS[role] || role}</span>;
}
