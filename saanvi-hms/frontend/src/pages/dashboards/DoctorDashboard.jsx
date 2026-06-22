import { Link } from 'react-router-dom';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';

export default function DoctorDashboard({ stats }) {
  return (
    <>
      <div className="dashboard__stats">
        <StatCard label="Total patients" value={stats.totalPatients} tone="accent" />
        <StatCard label="Your upcoming appointments" value={stats.upcomingAppointments} />
        <StatCard label="Completed so far" value={stats.completedAppointments} />
      </div>

      <Card title="Clinical overview" className="dashboard__panel">
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
          You can view patient records and manage your own <Link to="/appointments">appointments</Link> —
          mark them completed and add notes once a visit is done. Clinical notes beyond
          appointment records are planned for a future iteration.
        </p>
      </Card>
    </>
  );
}
