import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import './Auth.css';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    dateOfBirth: '',
    gender: 'male',
    phone: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      // Public self-registration always creates a 'patient' account.
      // Staff accounts are created by an admin from the Manage Staff screen.
      await register(form);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create account.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__brand">
          <span className="auth-card__brand-mark">S</span>
          <span className="auth-card__brand-name">SAANVI-HMS</span>
        </div>

        <h1>Create your account</h1>
        <p className="auth-card__subtitle">Patient self-registration. Staff accounts are created by an admin.</p>

        {error && <div className="auth-banner" role="alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <Input
            label="Full name"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            autoComplete="name"
          />
          <Input
            label="Email"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            minLength={6}
            hint="At least 6 characters."
            autoComplete="new-password"
          />
          <Input
            label="Date of birth"
            type="date"
            name="dateOfBirth"
            value={form.dateOfBirth}
            onChange={handleChange}
            required
          />
          <Input label="Gender" as="select" name="gender" value={form.gender} onChange={handleChange}>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </Input>
          <Input
            label="Phone"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            required
            autoComplete="tel"
            hint="Used to contact you about appointments."
          />
          <Button type="submit" fullWidth isLoading={isLoading}>
            Create account
          </Button>
        </form>

        <p className="auth-card__footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
