import Card from '../components/common/Card';

/**
 * Admin-only page. Reachable only because ProtectedRoute restricts
 * /staff to allowedRoles={['admin']} — see App.jsx. Full staff CRUD
 * (create doctor/nurse/receptionist accounts, deactivate users) is a
 * natural next step once Patients CRUD is reviewed and approved.
 */
export default function ManageStaff() {
  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>Manage staff</h1>
      <Card>
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
          Staff account management (create doctor/nurse/receptionist logins, deactivate
          accounts) will be built here next. This page is currently only reachable by the
          admin role, demonstrating route-level RBAC.
        </p>
      </Card>
    </div>
  );
}
