import { Link } from 'react-router-dom';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';

export default function AdminDashboard({ stats }) {
  return (
    <>
      <div className="dashboard__stats">
        <StatCard label="Total patients" value={stats.totalPatients} tone="accent" />
        <StatCard label="Upcoming appointments" value={stats.upcomingAppointments} />
        <StatCard label="Completed appointments" value={stats.completedAppointments} />
      </div>

      <Card title="Admin overview" className="dashboard__panel">
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
          You have full access: manage staff accounts, view and edit every patient record,
          delete records when needed, and oversee all <Link to="/appointments">appointments</Link> across
          every doctor. Use the sidebar to jump into Patients, Appointments, or Manage Staff.
        </p>
      </Card>
    </>
  );
}
