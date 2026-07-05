import { useEffect, useState } from 'react';
import { api, ApiError } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export function Notifications() {
  const { token, user, refreshUser } = useAuth();
  const [inApp, setInApp] = useState(true);
  const [sms, setSms] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!user) return;
    setInApp(user.in_app_notification ?? true);
    setSms(user.sms_notification ?? false);
  }, [user]);

  async function save() {
    if (!token) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.updateNotificationSettings(token, {
        in_app_notification: inApp,
        sms_notification: sms,
      });
      await refreshUser();
      setSuccess('Notification preferences saved.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="dash-page">
      <header className="dash-header">
        <h1>Notifications</h1>
        <p>Control how Viin delivers reminders, briefings, and updates to you.</p>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-info">{success}</div>}

      <section className="dash-card">
        <h3>Delivery channels</h3>
        <p className="dash-hint">
          Reminders can be delivered via chat and SMS. SMS requires a verified phone number
          and an active SMS notification preference.
        </p>

        <div className="dash-toggle-list">
          <label className="dash-toggle dash-toggle--card">
            <div>
              <strong>In-app & chat notifications</strong>
              <p className="dash-muted">Receive reminders and updates in the web assistant and connected channels.</p>
            </div>
            <input
              type="checkbox"
              checked={inApp}
              onChange={(e) => setInApp(e.target.checked)}
            />
          </label>

          <label className="dash-toggle dash-toggle--card">
            <div>
              <strong>SMS notifications</strong>
              <p className="dash-muted">
                Get reminder alerts via text message to {user?.phone || 'your phone'}.
              </p>
            </div>
            <input
              type="checkbox"
              checked={sms}
              onChange={(e) => setSms(e.target.checked)}
            />
          </label>
        </div>

        <button type="button" className="btn btn-primary" disabled={saving} onClick={save}>
          {saving ? 'Saving…' : 'Save preferences'}
        </button>
      </section>

      <section className="dash-card">
        <h3>Reminder delivery</h3>
        <p className="dash-muted">
          When creating reminders in Tasks, you can specify delivery channels. With SMS enabled
          above, include <code>sms</code> in the delivery channels for text alerts.
        </p>
        <ul className="dash-bullets">
          <li><strong>chat</strong> — Web assistant, Telegram, WhatsApp</li>
          <li><strong>sms</strong> — Text message (requires SMS notifications on)</li>
        </ul>
      </section>
    </div>
  );
}
