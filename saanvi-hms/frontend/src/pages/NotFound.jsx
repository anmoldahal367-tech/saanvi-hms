import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <h1 style={{ fontSize: 40 }}>404</h1>
      <p style={{ color: 'var(--color-text-muted)' }}>That page doesn't exist.</p>
      <Link to="/dashboard">Back to dashboard</Link>
    </div>
  );
}
