import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api/client';

export function SignUp() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const phone = String(form.get('phone') || '').trim();

    try {
      await api.signUp({
        fullname: String(form.get('fullname') || '').trim(),
        email: String(form.get('email') || '').trim(),
        phone,
        password: String(form.get('password') || ''),
        ghana_card: String(form.get('ghana_card') || '').trim(),
        company: String(form.get('company') || '').trim() || undefined,
      });
      navigate('/verify', { state: { phone } });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Create your account</h1>
        <p className="auth-sub">Set up your personal task assistant in a few steps.</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Full name
            <input name="fullname" required autoComplete="name" placeholder="Jane Doe" />
          </label>
          <label>
            Email
            <input name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
          </label>
          <label>
            Phone number
            <input
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              placeholder="0241234567"
              pattern="[0-9]{10,15}"
              title="10–15 digit phone number"
            />
          </label>
          <label>
            Ghana Card ID
            <input
              name="ghana_card"
              required
              placeholder="GHA-XXXXXXXXX-X"
              minLength={3}
            />
          </label>
          <label>
            Company <span className="optional">(optional)</span>
            <input name="company" placeholder="Your business name" />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={4}
              placeholder="At least 4 characters"
            />
          </label>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/signin">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
