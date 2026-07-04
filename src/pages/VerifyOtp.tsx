import { type FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api/client';

export function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const phoneFromState = (location.state as { phone?: string } | null)?.phone || '';
  const [phone, setPhone] = useState(phoneFromState);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const otp = String(form.get('otp') || '').trim();
    const phoneNum = String(form.get('phone') || phone).trim();

    try {
      const res = await api.verifyOtp(phoneNum, otp);
      if (!res.success) {
        setError(res.message || 'Invalid OTP');
        return;
      }
      navigate('/signin', { state: { verified: true } });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Verification failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError('');
    setInfo('');
    if (!phone) {
      setError('Enter your phone number first.');
      return;
    }
    try {
      const res = await api.resendOtp(phone);
      setInfo(res.message || 'OTP sent.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not resend OTP.');
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Verify your phone</h1>
        <p className="auth-sub">
          Enter the 5-digit code we sent to your phone. Codes expire quickly — enter it as soon as
          you receive it.
        </p>

        {error && <div className="alert alert-error">{error}</div>}
        {info && <div className="alert alert-info">{info}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {!phoneFromState && (
            <label>
              Phone number
              <input
                name="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0241234567"
              />
            </label>
          )}
          {phoneFromState && <input type="hidden" name="phone" value={phone} />}
          <label>
            Verification code
            <input
              name="otp"
              required
              inputMode="numeric"
              pattern="[0-9]{5}"
              maxLength={5}
              placeholder="12345"
              autoComplete="one-time-code"
            />
          </label>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Verifying…' : 'Verify & continue'}
          </button>
        </form>

        <button type="button" className="btn btn-ghost btn-block" onClick={handleResend}>
          Resend code
        </button>

        <p className="auth-footer">
          <Link to="/signin">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
