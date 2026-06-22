import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { appointmentApi } from '../../api/appointmentApi';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';
import './PatientDashboard.css';

/**
 * This is the patient's "My Records" view: their own upcoming and recent
 * appointments, pulled from the same /api/appointments endpoint the rest
 * of the app uses — the backend automatically scopes results to whichever
 * Patient profile is linked to this logged-in user (see appointmentController.js).
 */
export default function PatientDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    appointmentApi
      .getAll({ limit: 5 })
      .then(({ data }) => setAppointments(data.appointments))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const formatWhen = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) +
      ' \u00b7 ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <Card
      title="Your recent appointments"
      actions={<Link to="/appointments">View all</Link>}
      className="dashboard__panel"
    >
      {isLoading && <p className="patient-dash__empty">Loading…</p>}

      {!isLoading && appointments.length === 0 && (
        <p className="patient-dash__empty">
          You don't have any appointments yet. Go to <Link to="/appointments">Appointments</Link> to book one.
        </p>
      )}

      {!isLoading && appointments.length > 0 && (
        <div className="patient-dash__appt-list">
          {appointments.map((appt) => (
            <div key={appt.id} className="patient-dash__appt">
              <div className="patient-dash__appt-main">
                <span className="patient-dash__appt-when">{formatWhen(appt.scheduledAt)}</span>
                <span className="patient-dash__appt-with">with Dr. {appt.doctor?.name}</span>
              </div>
              <StatusBadge status={appt.status} />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

