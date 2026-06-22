import './StatusBadge.css';

/** Small colored chip for an appointment's status (scheduled/completed/cancelled). */
export default function StatusBadge({ status }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return <span className={`status-badge status-badge--${status}`}>{label}</span>;
}
