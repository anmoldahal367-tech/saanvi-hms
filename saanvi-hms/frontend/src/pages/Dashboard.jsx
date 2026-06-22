import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/roles';
import { patientApi } from '../api/patientApi';
import { appointmentApi } from '../api/appointmentApi';
import AdminDashboard from './dashboards/AdminDashboard';
import DoctorDashboard from './dashboards/DoctorDashboard';
import NurseDashboard from './dashboards/NurseDashboard';
import ReceptionistDashboard from './dashboards/ReceptionistDashboard';
import PatientDashboard from './dashboards/PatientDashboard';
import './Dashboard.css';

// Maps each role to the dashboard component it should see. This is the
// clearest expression of "RBAC Dashboard" in the app: one route, one
// page component, but the rendered content is entirely role-driven.
const DASHBOARD_BY_ROLE = {
  [ROLES.ADMIN]: AdminDashboard,
  [ROLES.DOCTOR]: DoctorDashboard,
  [ROLES.NURSE]: NurseDashboard,
  [ROLES.RECEPTIONIST]: ReceptionistDashboard,
  [ROLES.PATIENT]: PatientDashboard,
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalPatients: '—',
    upcomingAppointments: '—',
    completedAppointments: '—',
  });

  useEffect(() => {
    const loadStats = async () => {
      // Patients themselves aren't authorized to list all patient records,
      // so skip that fetch entirely for that role rather than calling an
      // endpoint we know will 403.
      if (user.role !== ROLES.PATIENT) {
        try {
          const { data } = await patientApi.getAll({ limit: 1 });
          setStats((s) => ({ ...s, totalPatients: data.total }));
        } catch {
          // Non-critical — dashboard still renders fine with a placeholder.
        }
      }

      try {
        const { data: scheduled } = await appointmentApi.getAll({ status: 'scheduled', limit: 1 });
        setStats((s) => ({ ...s, upcomingAppointments: scheduled.total }));
      } catch {
        // Non-critical.
      }

      try {
        const { data: completed } = await appointmentApi.getAll({ status: 'completed', limit: 1 });
        setStats((s) => ({ ...s, completedAppointments: completed.total }));
      } catch {
        // Non-critical.
      }
    };
    loadStats();
  }, [user.role]);

  const RoleDashboard = DASHBOARD_BY_ROLE[user.role] || PatientDashboard;

  return (
    <div>
      <div className="dashboard__header">
        <h1 className="dashboard__greeting">Welcome, {user.name.split(' ')[0]}</h1>
        <p className="dashboard__subtitle">Here's what's relevant to your role today.</p>
      </div>

      <RoleDashboard stats={stats} />
    </div>
  );
}
