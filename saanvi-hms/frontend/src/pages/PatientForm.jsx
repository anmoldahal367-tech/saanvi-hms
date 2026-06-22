import { useState, useEffect } from 'react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const BLANK_FORM = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  gender: 'male',
  phone: '',
  email: '',
  address: '',
  bloodGroup: 'unknown',
  medicalNotes: '',
};

/**
 * Add/edit form for a patient. Pass `initialValues` to pre-fill for editing;
 * omit it (or pass null) for a fresh "add patient" form.
 */
export default function PatientForm({ initialValues, onSubmit, onCancel, isSubmitting }) {
  const [form, setForm] = useState(BLANK_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialValues) {
      setForm({
        ...BLANK_FORM,
        ...initialValues,
        // DATEONLY comes back as 'YYYY-MM-DD' already, but guard just in case.
        dateOfBirth: initialValues.dateOfBirth?.slice(0, 10) || '',
      });
    }
  }, [initialValues]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.firstName.trim()) next.firstName = 'First name is required';
    if (!form.lastName.trim()) next.lastName = 'Last name is required';
    if (!form.dateOfBirth) next.dateOfBirth = 'Date of birth is required';
    if (!form.phone.trim()) next.phone = 'Phone number is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <Input label="First name" name="firstName" value={form.firstName} onChange={handleChange} error={errors.firstName} required />
        <Input label="Last name" name="lastName" value={form.lastName} onChange={handleChange} error={errors.lastName} required />
        <Input label="Date of birth" type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} error={errors.dateOfBirth} required />
        <Input label="Gender" as="select" name="gender" value={form.gender} onChange={handleChange}>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </Input>
        <Input label="Phone" name="phone" value={form.phone} onChange={handleChange} error={errors.phone} required />
        <Input label="Email (optional)" type="email" name="email" value={form.email || ''} onChange={handleChange} />
      </div>

      <Input label="Address (optional)" name="address" value={form.address || ''} onChange={handleChange} />

      <Input label="Blood group" as="select" name="bloodGroup" value={form.bloodGroup} onChange={handleChange}>
        <option value="unknown">Unknown</option>
        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
          <option key={bg} value={bg}>{bg}</option>
        ))}
      </Input>

      <Input
        label="Medical notes (optional)"
        as="textarea"
        name="medicalNotes"
        value={form.medicalNotes || ''}
        onChange={handleChange}
        hint="Allergies, ongoing conditions, etc."
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" isLoading={isSubmitting}>
          {initialValues ? 'Save changes' : 'Add patient'}
        </Button>
      </div>
    </form>
  );
}
