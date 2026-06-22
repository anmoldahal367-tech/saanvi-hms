import { useState, useEffect } from 'react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const BLANK_FORM = {
  patientId: '',
  doctorId: '',
  scheduledDate: '',
  scheduledTime: '',
  reason: '',
};

/**
 * Booking form for a new appointment. `patients` is only needed when the
 * booking user can choose any patient (admin/receptionist) — pass null to
 * hide that field entirely when a patient is booking for themselves.
 */
export default function AppointmentForm({ doctors, patients, onSubmit, onCancel, isSubmitting }) {
  const [form, setForm] = useState(BLANK_FORM);
  const [errors, setErrors] = useState({});

  // Default the doctor dropdown to the first available doctor once the list loads.
  useEffect(() => {
    if (doctors?.length && !form.doctorId) {
      setForm((f) => ({ ...f, doctorId: doctors[0].id }));
    }
  }, [doctors, form.doctorId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (patients && !form.patientId) next.patientId = 'Please select a patient';
    if (!form.doctorId) next.doctorId = 'Please select a doctor';
    if (!form.scheduledDate) next.scheduledDate = 'Date is required';
    if (!form.scheduledTime) next.scheduledTime = 'Time is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Combine the separate date and time inputs into one ISO timestamp,
    // since that's what the backend's `scheduledAt` column expects.
    const scheduledAt = new Date(`${form.scheduledDate}T${form.scheduledTime}`).toISOString();

    onSubmit({
      ...(patients ? { patientId: form.patientId } : {}),
      doctorId: form.doctorId,
      scheduledAt,
      reason: form.reason,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {patients && (
        <Input
          label="Patient"
          as="select"
          name="patientId"
          value={form.patientId}
          onChange={handleChange}
          error={errors.patientId}
          required
        >
          <option value="">Select a patient…</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>{p.firstName} {p.lastName} — {p.phone}</option>
          ))}
        </Input>
      )}

      <Input
        label="Doctor"
        as="select"
        name="doctorId"
        value={form.doctorId}
        onChange={handleChange}
        error={errors.doctorId}
        required
      >
        {doctors?.length === 0 && <option value="">No doctors available</option>}
        {doctors?.map((d) => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </Input>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <Input
          label="Date"
          type="date"
          name="scheduledDate"
          value={form.scheduledDate}
          onChange={handleChange}
          error={errors.scheduledDate}
          required
        />
        <Input
          label="Time"
          type="time"
          name="scheduledTime"
          value={form.scheduledTime}
          onChange={handleChange}
          error={errors.scheduledTime}
          required
        />
      </div>

      <Input
        label="Reason for visit (optional)"
        as="textarea"
        name="reason"
        value={form.reason}
        onChange={handleChange}
        hint="e.g. routine check-up, follow-up, fever"
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" isLoading={isSubmitting}>Book appointment</Button>
      </div>
    </form>
  );
}
