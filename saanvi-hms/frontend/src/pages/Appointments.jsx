import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/roles';
import { appointmentApi } from '../api/appointmentApi';
import { patientApi } from '../api/patientApi';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Icon from '../components/common/Icon';
import StatusBadge from '../components/common/StatusBadge';
import AppointmentForm from './AppointmentForm';
import './Appointments.css';

const FILTERS = [
  { key: '', label: 'All' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function Appointments() {
  const { user, hasRole } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);

  const [isBookOpen, setIsBookOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [cancelTarget, setCancelTarget] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [banner, setBanner] = useState(null);

  // Who can do what — mirrors the backend's authorize(...) checks, purely
  // so the UI doesn't show buttons that would just fail server-side.
  const canBook = hasRole([ROLES.ADMIN, ROLES.RECEPTIONIST, ROLES.PATIENT]);
  const canEditAny = hasRole([ROLES.ADMIN, ROLES.RECEPTIONIST]);
  const canUpdateOwnAsDoctor = hasRole(ROLES.DOCTOR);
  const canCancelOwnAsPatient = hasRole(ROLES.PATIENT);
  const canDelete = hasRole(ROLES.ADMIN);
  // Admin/receptionist can pick any patient when booking; a patient books
  // only for themselves, so the form simply omits the patient dropdown.
  const pickPatientWhenBooking = hasRole([ROLES.ADMIN, ROLES.RECEPTIONIST]);

  const loadAppointments = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await appointmentApi.getAll({ status: statusFilter || undefined, page, limit: 8 });
      setAppointments(data.appointments);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setBanner({ type: 'error', message: err.response?.data?.message || 'Failed to load appointments.' });
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Doctor list is needed by anyone who can book. Patient list is only
  // needed by admin/receptionist, since a patient books only for themselves.
  useEffect(() => {
    if (!canBook) return;
    appointmentApi.getDoctors().then(({ data }) => setDoctors(data.doctors)).catch(() => {});
    if (pickPatientWhenBooking) {
      patientApi.getAll({ limit: 100 }).then(({ data }) => setPatients(data.patients)).catch(() => {});
    }
  }, [canBook, pickPatientWhenBooking]);

  useEffect(() => {
    if (banner?.type === 'success') {
      const t = setTimeout(() => setBanner(null), 4000);
      return () => clearTimeout(t);
    }
  }, [banner]);

  const handleFilterChange = (key) => {
    setStatusFilter(key);
    setPage(1);
  };

  const handleBookSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      await appointmentApi.create(formData);
      setBanner({ type: 'success', message: 'Appointment booked successfully.' });
      setIsBookOpen(false);
      loadAppointments();
    } catch (err) {
      setBanner({ type: 'error', message: err.response?.data?.message || 'Could not book appointment.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Doctor marking their own appointment as completed — a quick one-click
  // action rather than opening a whole edit form, since this is the most
  // common thing a doctor does here.
  const handleMarkCompleted = async (appointment) => {
    try {
      await appointmentApi.update(appointment.id, { status: 'completed' });
      setBanner({ type: 'success', message: 'Marked as completed.' });
      loadAppointments();
    } catch (err) {
      setBanner({ type: 'error', message: err.response?.data?.message || 'Could not update appointment.' });
    }
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await appointmentApi.update(cancelTarget.id, { status: 'cancelled' });
      setBanner({ type: 'success', message: 'Appointment cancelled.' });
      setCancelTarget(null);
      loadAppointments();
    } catch (err) {
      setBanner({ type: 'error', message: err.response?.data?.message || 'Could not cancel appointment.' });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await appointmentApi.remove(deleteTarget.id);
      setBanner({ type: 'success', message: 'Appointment record deleted.' });
      setDeleteTarget(null);
      loadAppointments();
    } catch (err) {
      setBanner({ type: 'error', message: err.response?.data?.message || 'Could not delete appointment.' });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDateTime = (iso) => {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
      time: d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
    };
  };

  const columns = [
    {
      key: 'when',
      header: 'Date & time',
      render: (row) => {
        const { date, time } = formatDateTime(row.scheduledAt);
        return (
          <div className="appointments-page__when">
            <span className="appointments-page__when-date">{date}</span>
            <span className="appointments-page__when-time">{time}</span>
          </div>
        );
      },
    },
    // Patients already know who they are, so skip that column for them —
    // it's redundant and just adds noise to a screen they'll check often.
    ...(user.role !== ROLES.PATIENT
      ? [{ key: 'patient', header: 'Patient', render: (row) => `${row.patient?.firstName} ${row.patient?.lastName}` }]
      : []),
    { key: 'doctor', header: 'Doctor', render: (row) => row.doctor?.name },
    { key: 'reason', header: 'Reason', render: (row) => row.reason || '—' },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="appointments-page__row-actions">
          {canUpdateOwnAsDoctor && row.status === 'scheduled' && (
            <Button variant="ghost" onClick={() => handleMarkCompleted(row)} title="Mark as completed">
              Mark done
            </Button>
          )}
          {(canEditAny || canCancelOwnAsPatient) && row.status === 'scheduled' && (
            <Button variant="ghost" onClick={() => setCancelTarget(row)} title="Cancel">
              Cancel
            </Button>
          )}
          {canDelete && (
            <Button variant="ghost" onClick={() => setDeleteTarget(row)} title="Delete">
              <Icon name="trash" size={16} />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="appointments-page__header">
        <h1 className="appointments-page__title">Appointments</h1>
        {canBook && (
          <Button onClick={() => setIsBookOpen(true)}>
            <Icon name="plus" size={16} /> Book appointment
          </Button>
        )}
      </div>

      {banner && (
        <div className={`appointments-page__banner appointments-page__banner--${banner.type}`} role="status">
          {banner.message}
        </div>
      )}

      <div className="appointments-page__filter">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`appointments-page__filter-btn ${statusFilter === f.key ? 'appointments-page__filter-btn--active' : ''}`}
            onClick={() => handleFilterChange(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card>
        <Table
          columns={columns}
          rows={appointments}
          isLoading={isLoading}
          emptyMessage="No appointments to show."
        />

        {totalPages > 1 && (
          <div className="appointments-page__pagination">
            <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span>Page {page} of {totalPages}</span>
            <Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        )}
      </Card>

      <Modal
        isOpen={isBookOpen}
        onClose={() => setIsBookOpen(false)}
        title="Book an appointment"
        size="lg"
      >
        <AppointmentForm
          doctors={doctors}
          patients={pickPatientWhenBooking ? patients : null}
          onSubmit={handleBookSubmit}
          onCancel={() => setIsBookOpen(false)}
          isSubmitting={isSubmitting}
        />
      </Modal>

      <Modal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Cancel appointment"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelTarget(null)}>Keep it</Button>
            <Button variant="danger" isLoading={isCancelling} onClick={handleCancel}>Cancel appointment</Button>
          </>
        }
      >
        <p style={{ margin: 0 }}>
          Are you sure you want to cancel this appointment
          {cancelTarget && ` on ${formatDateTime(cancelTarget.scheduledAt).date}`}?
        </p>
      </Modal>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete appointment record"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" isLoading={isDeleting} onClick={handleDelete}>Delete</Button>
          </>
        }
      >
        <p style={{ margin: 0 }}>
          This permanently deletes the appointment record. This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
