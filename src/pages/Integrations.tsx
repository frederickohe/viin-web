import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ApiError, api, type GoogleCalendarStatus } from '../api/client';
import { useAuth } from '../context/AuthContext';

export function Integrations() {
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState<GoogleCalendarStatus | null>(null);
  const [leadMinutes, setLeadMinutes] = useState(15);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadStatus = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.getGoogleCalendarStatus(token);
      setStatus(data);
      setLeadMinutes(data.reminder_lead_minutes ?? 15);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load integration status.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const connected = searchParams.get('connected');
    const oauthError = searchParams.get('error');
    if (connected === 'google_calendar') {
      setMessage('Google Calendar connected. Viin will sync your upcoming events.');
      setSearchParams({}, { replace: true });
      loadStatus();
    } else if (oauthError === 'google_calendar') {
      setError('Could not connect Google Calendar. Please try again.');
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, loadStatus]);

  async function handleConnect() {
    if (!token) return;
    setBusy(true);
    setError('');
    try {
      const { authorization_url } = await api.getGoogleCalendarConnectUrl(token);
      window.location.href = authorization_url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start Google sign-in.');
      setBusy(false);
    }
  }

  async function handleDisconnect() {
    if (!token) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api.disconnectGoogleCalendar(token);
      setMessage('Google Calendar disconnected.');
      await loadStatus();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not disconnect Google Calendar.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSyncNow() {
    if (!token) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await api.syncGoogleCalendar(token);
      setMessage(
        `Synced ${result.synced_events} events (${result.reminders_created} new, ${result.reminders_updated} updated).`,
      );
      await loadStatus();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Calendar sync failed.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveSettings(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const updated = await api.updateGoogleCalendarSettings(token, {
        reminder_lead_minutes: leadMinutes,
      });
      setStatus(updated);
      setMessage('Reminder settings saved.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save settings.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card integrations-card">
        <h1>Integrations</h1>
        <p className="auth-sub">
          Connect Google Calendar and Viin will remind you before your events via chat and SMS.
        </p>

        {message && <div className="alert alert-info">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="page-center">
            <div className="spinner" aria-label="Loading" />
          </div>
        ) : (
          <section className="integration-panel">
            <div className="integration-panel__header">
              <div>
                <h2>Google Calendar</h2>
                <p className="integration-panel__meta">
                  {status?.connected
                    ? `Connected as ${status.google_account_email || 'your Google account'}`
                    : 'Not connected'}
                </p>
                {status?.connected && status.last_synced_at && (
                  <p className="integration-panel__meta">
                    Last synced: {new Date(status.last_synced_at).toLocaleString()}
                  </p>
                )}
                {status?.connected && status.last_sync_error && (
                  <p className="integration-panel__error">Last sync error: {status.last_sync_error}</p>
                )}
              </div>
              <div className="integration-panel__actions">
                {status?.connected ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={handleSyncNow}
                      disabled={busy}
                    >
                      Sync now
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={handleDisconnect}
                      disabled={busy}
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleConnect}
                    disabled={busy}
                  >
                    Connect Google Calendar
                  </button>
                )}
              </div>
            </div>

            {status?.connected && (
              <form onSubmit={handleSaveSettings} className="auth-form integration-settings">
                <label>
                  Remind me before events
                  <div className="integration-settings__row">
                    <input
                      type="number"
                      min={0}
                      max={1440}
                      value={leadMinutes}
                      onChange={(e) => setLeadMinutes(Number(e.target.value))}
                    />
                    <span>minutes</span>
                  </div>
                </label>
                <button type="submit" className="btn btn-outline btn-sm" disabled={busy}>
                  Save settings
                </button>
              </form>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
