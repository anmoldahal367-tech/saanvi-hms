import { useState, useEffect } from 'react';
import { prescriptionApi } from '../../api/prescriptionApi';
import { downloadPrescriptionPDF } from '../../utils/pdfGenerator';
import Button from './Button';
import Input from './Input';
import Icon from './Icon';
import './PrescriptionModal.css';

const BLANK_MEDICINE = { medicine: '', dosage: '', frequency: '', duration: '', notes: '' };

/**
 * Shows inside a Modal. When the appointment already has a prescription,
 * it displays it with a PDF download button. If not, a doctor/admin sees
 * a form to write one.
 *
 * Props:
 *   appointmentId  — the appointment to load/write a prescription for
 *   appointment    — the appointment object (for PDF context: patient/doctor name)
 *   canWrite       — boolean: current user is allowed to write prescriptions
 *   onClose        — called when done
 */
export default function PrescriptionModal({ appointmentId, appointment, canWrite, onClose }) {
  const [prescription, setPrescription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [medicines, setMedicines] = useState([{ ...BLANK_MEDICINE }]);
  const [generalInstructions, setGeneralInstructions] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await prescriptionApi.getByAppointment(appointmentId);
        setPrescription(data.prescription);
        setMedicines(data.prescription.medicines.length > 0 ? data.prescription.medicines : [{ ...BLANK_MEDICINE }]);
        setGeneralInstructions(data.prescription.generalInstructions || '');
      } catch (err) {
        if (err.response?.status === 404) {
          // No prescription yet — show the write form if canWrite.
          setPrescription(null);
          if (canWrite) setIsEditing(true);
        }
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [appointmentId, canWrite]);

  const addMedicine = () => setMedicines((ms) => [...ms, { ...BLANK_MEDICINE }]);

  const removeMedicine = (i) =>
    setMedicines((ms) => ms.filter((_, idx) => idx !== i));

  const updateMedicine = (i, field, value) =>
    setMedicines((ms) => ms.map((m, idx) => (idx === i ? { ...m, [field]: value } : m)));

  const handleSave = async () => {
    const filled = medicines.filter((m) => m.medicine.trim());
    if (filled.length === 0) {
      setError('Add at least one medicine.');
      return;
    }
    setError('');
    setIsSaving(true);
    try {
      if (prescription) {
        const { data } = await prescriptionApi.update(prescription.id, {
          medicines: filled,
          generalInstructions,
        });
        setPrescription(data.prescription);
      } else {
        const { data } = await prescriptionApi.create({
          appointmentId,
          medicines: filled,
          generalInstructions,
        });
        setPrescription(data.prescription);
      }
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save prescription.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    if (prescription) {
      downloadPrescriptionPDF(prescription, appointment);
    }
  };

  if (isLoading) {
    return <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>Loading…</p>;
  }

  // ── View mode ──────────────────────────────────────────────────────────────
  if (prescription && !isEditing) {
    return (
      <div>
        <div className="rx-view__actions">
          <Button variant="secondary" onClick={handleDownload}>
            <Icon name="download" size={15} /> Download PDF
          </Button>
          {canWrite && (
            <Button variant="ghost" onClick={() => setIsEditing(true)}>
              Edit prescription
            </Button>
          )}
        </div>

        <p className="rx-view__prescriber">
          Written by <strong>{prescription.prescriber?.name}</strong>
        </p>

        <div className="rx-view__medicines">
          {prescription.medicines.map((m, i) => (
            <div key={i} className="rx-view__medicine">
              <div className="rx-view__medicine-name">💊 {m.medicine}</div>
              <div className="rx-view__medicine-details">
                <span><strong>Dosage:</strong> {m.dosage}</span>
                <span><strong>Frequency:</strong> {m.frequency}</span>
                <span><strong>Duration:</strong> {m.duration}</span>
              </div>
              {m.notes && <p className="rx-view__medicine-note">{m.notes}</p>}
            </div>
          ))}
        </div>

        {prescription.generalInstructions && (
          <div className="rx-view__instructions">
            <strong>General instructions:</strong>
            <p>{prescription.generalInstructions}</p>
          </div>
        )}
      </div>
    );
  }

  // ── No prescription, not allowed to write ─────────────────────────────────
  if (!prescription && !canWrite) {
    return (
      <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
        No prescription has been written for this appointment yet.
      </p>
    );
  }

  // ── Write / edit mode ─────────────────────────────────────────────────────
  return (
    <div>
      <p className="rx-form__hint">Add the medicines prescribed in this appointment.</p>

      {medicines.map((m, i) => (
        <div key={i} className="rx-form__medicine">
          <div className="rx-form__medicine-header">
            <span className="rx-form__medicine-num">Medicine {i + 1}</span>
            {medicines.length > 1 && (
              <button className="rx-form__remove" onClick={() => removeMedicine(i)}>Remove</button>
            )}
          </div>
          <div className="rx-form__medicine-grid">
            <Input
              label="Medicine name"
              value={m.medicine}
              onChange={(e) => updateMedicine(i, 'medicine', e.target.value)}
              required
            />
            <Input
              label="Dosage"
              value={m.dosage}
              onChange={(e) => updateMedicine(i, 'dosage', e.target.value)}
              hint="e.g. 500mg"
            />
            <Input
              label="Frequency"
              value={m.frequency}
              onChange={(e) => updateMedicine(i, 'frequency', e.target.value)}
              hint="e.g. Twice daily"
            />
            <Input
              label="Duration"
              value={m.duration}
              onChange={(e) => updateMedicine(i, 'duration', e.target.value)}
              hint="e.g. 5 days"
            />
          </div>
          <Input
            label="Notes (optional)"
            value={m.notes}
            onChange={(e) => updateMedicine(i, 'notes', e.target.value)}
            hint="e.g. Take after food"
          />
        </div>
      ))}

      <Button variant="secondary" onClick={addMedicine} style={{ marginBottom: 16 }}>
        + Add another medicine
      </Button>

      <Input
        label="General instructions (optional)"
        as="textarea"
        value={generalInstructions}
        onChange={(e) => setGeneralInstructions(e.target.value)}
        hint="e.g. Rest for 3 days, drink plenty of fluids"
      />

      {error && (
        <p style={{ color: 'var(--color-danger)', fontSize: 13, margin: '0 0 12px' }}>{error}</p>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        {prescription && (
          <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
        )}
        <Button isLoading={isSaving} onClick={handleSave}>
          {prescription ? 'Update prescription' : 'Save prescription'}
        </Button>
      </div>
    </div>
  );
}
