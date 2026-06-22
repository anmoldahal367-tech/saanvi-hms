import { Link } from 'react-router-dom';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';

export default function ReceptionistDashboard({ stats }) {
  return (
    <>
      <div className="dashboard__stats">
        <StatCard label="Total patients" value={stats.totalPatients} tone="accent" />
        <StatCard label="Upcoming appointments" value={stats.upcomingAppointments} />
      </div>

      <Card title="Front desk overview" className="dashboard__panel">
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
          You can register new patients and edit their contact details, plus
          book, reschedule, or cancel <Link to="/appointments">appointments</Link> on
          behalf of any patient. Go to Patients or Appointments in the sidebar to get started.
        </p>
      </Card>
    </>
  );
}
