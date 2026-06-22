import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import './Auth.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const redirectTo = location.state?.from || '/dashboard';

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(form.email, form.password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not log in. Check your credentials.');
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

        <h1>Welcome back</h1>
        <p className="auth-card__subtitle">Sign in to access your dashboard.</p>

        {error && <div className="auth-banner" role="alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            autoComplete="email"
            placeholder="you@saanvi.test"
          />
          <Input
            label="Password"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            autoComplete="current-password"
            placeholder="••••••••"
          />
          <Button type="submit" fullWidth isLoading={isLoading}>
            Sign in
          </Button>
        </form>

        <p className="auth-card__footer">
          New here? <Link to="/register">Create an account</Link>
        </p>

        <div className="auth-demo-hint">
          Demo logins (password: <code>password123</code>): <code>admin@saanvi.test</code>,{' '}
          <code>doctor@saanvi.test</code>, <code>nurse@saanvi.test</code>,{' '}
          <code>receptionist@saanvi.test</code>, <code>patient@saanvi.test</code>
        </div>
      </div>
    </div>
  );
}
