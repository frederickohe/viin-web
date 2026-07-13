import { type FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, ApiError, type ViinService } from '../api/client';
import { parseServiceParam, serviceLabel } from '../lib/services';

export function SignUp() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const service = useMemo(
    () => parseServiceParam(searchParams.get('service')),
    [searchParams],
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function setService(next: ViinService) {
    setSearchParams({ service: next });
  }

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
        services: [service],
      });
      navigate('/verify', { state: { phone, service } });
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
        <p className="auth-sub">
          One signup for Viin — choose the service you want to start with.
        </p>

        <div className="product-switch" role="tablist" aria-label="Service">
          <button
            type="button"
            className={service === 'assistant' ? 'is-active' : ''}
            onClick={() => setService('assistant')}
          >
            Task Assistant
          </button>
          <button
            type="button"
            className={service === 'trading' ? 'is-active' : ''}
            onClick={() => setService('trading')}
          >
            Trading Bot
          </button>
        </div>

        <span className="auth-service-pill">{serviceLabel(service)}</span>

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
            {loading ? 'Creating account…' : `Create ${serviceLabel(service)} account`}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to={`/signin?service=${service}`}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
