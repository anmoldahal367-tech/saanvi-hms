import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wraps a route element. Redirects to /login if not authenticated.
 * If `allowedRoles` is given and the user's role isn't in it, redirects
 * to /dashboard instead of rendering the page — this is the route-level
 * half of RBAC on the frontend (the backend independently re-checks
 * every request, so this is a UX guard, not the security boundary).
 *
 * <ProtectedRoute allowedRoles={['admin']}><ManageStaff /></ProtectedRoute>
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
