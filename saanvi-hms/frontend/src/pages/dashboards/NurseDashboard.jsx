import { Link } from 'react-router-dom';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';

export default function NurseDashboard({ stats }) {
  return (
    <>
      <div className="dashboard__stats">
        <StatCard label="Total patients" value={stats.totalPatients} tone="accent" />
        <StatCard label="Upcoming appointments" value={stats.upcomingAppointments} />
      </div>

      <Card title="Ward overview" className="dashboard__panel">
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
          You can register new patients and update existing records. You can also view every
          scheduled <Link to="/appointments">appointment</Link> across all doctors to help
          coordinate the ward, though booking and editing is handled by reception.
        </p>
      </Card>
    </>
  );
}
