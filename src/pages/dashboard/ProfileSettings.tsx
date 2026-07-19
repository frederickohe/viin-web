import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export function ProfileSettings() {
  const { token, user, refreshUser, setUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [form, setForm] = useState({
    fullname: '',
    phone: '',
    company: '',
    occupation: '',
    organization_workplace: '',
    location: '',
    address: '',
    whatsapp_number: '',
    linkedin_url: '',
    profile_sharing: false,
  });

  useEffect(() => {
    if (!user) return;
    setForm({
      fullname: user.fullname || '',
      phone: user.phone || '',
      company: user.company || '',
      occupation: user.occupation || '',
      organization_workplace: user.organization_workplace || '',
      location: user.location || '',
      address: user.address || '',
      whatsapp_number: user.whatsapp_number || '',
      linkedin_url: user.linkedin_url || '',
      profile_sharing: user.profile_sharing ?? false,
    });
  }, [user]);

  const loadChatChannels = useCallback(async () => {
    if (!token) return;
    try {
      const channels = await api.getChatChannels(token);
      setTelegramConnected(channels.telegram.connected);
    } catch {
      /* channel status is optional UI */
    }
  }, [token]);

  useEffect(() => {
    loadChatChannels();
  }, [loadChatChannels]);

  function update(field: keyof typeof form, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const updated = await api.updateMe(token, form);
      setUser(updated);
      await refreshUser();
      setSuccess('Profile updated. Your task assistant will use this context in conversations.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleDisconnectTelegram() {
    if (!token || !telegramConnected) return;
    const confirmed = window.confirm(
      'Disconnect Telegram from your Viin account? You can reconnect anytime by sending the link command in Telegram.',
    );
    if (!confirmed) return;

    setDisconnecting(true);
    setError('');
    setSuccess('');
    try {
      const result = await api.disconnectTelegram(token);
      setTelegramConnected(false);
      setSuccess(result.message);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not disconnect Telegram.');
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div className="dash-page">
      <header className="dash-header">
        <h1>Profile & context</h1>
        <p>
          Viin uses your profile to personalize responses and understand your organization.
        </p>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-info">{success}</div>}

      <form className="dash-form dash-card" onSubmit={handleSubmit}>
        <fieldset className="dash-fieldset">
          <legend>Personal</legend>
          <label>
            Full name
            <input value={form.fullname} onChange={(e) => update('fullname', e.target.value)} />
          </label>
          <label>
            Phone
            <input value={form.phone} onChange={(e) => update('phone', e.target.value)} />
          </label>
          <label>
            Location
            <input value={form.location} onChange={(e) => update('location', e.target.value)} placeholder="City, country" />
          </label>
          <label>
            Address
            <input value={form.address} onChange={(e) => update('address', e.target.value)} />
          </label>
        </fieldset>

        <fieldset className="dash-fieldset">
          <legend>Work & organization</legend>
          <p className="dash-hint">
            These fields shape how Viin understands your role and workplace.
          </p>
          <label>
            Company
            <input value={form.company} onChange={(e) => update('company', e.target.value)} />
          </label>
          <label>
            Occupation / role
            <input value={form.occupation} onChange={(e) => update('occupation', e.target.value)} placeholder="e.g. Product Manager" />
          </label>
          <label>
            Organization / workplace
            <input
              value={form.organization_workplace}
              onChange={(e) => update('organization_workplace', e.target.value)}
              placeholder="Department or team name"
            />
          </label>
        </fieldset>

        <fieldset className="dash-fieldset">
          <legend>Channels</legend>
          <div className="channel-row">
            <div>
              <strong>Telegram</strong>
              <p className="dash-muted">
                {telegramConnected
                  ? 'Connected — Viin can message you on Telegram.'
                  : 'Not connected — send "link" plus your Viin phone number in the Telegram bot to connect.'}
              </p>
            </div>
            {telegramConnected && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleDisconnectTelegram}
                disabled={disconnecting}
              >
                {disconnecting ? 'Disconnecting…' : 'Disconnect Telegram'}
              </button>
            )}
          </div>
          <label>
            WhatsApp number
            <input value={form.whatsapp_number} onChange={(e) => update('whatsapp_number', e.target.value)} />
          </label>
          <label>
            LinkedIn URL
            <input value={form.linkedin_url} onChange={(e) => update('linkedin_url', e.target.value)} />
          </label>
          <label className="dash-toggle">
            <input
              type="checkbox"
              checked={form.profile_sharing}
              onChange={(e) => update('profile_sharing', e.target.checked)}
            />
            <span>Allow profile sharing with connected services</span>
          </label>
        </fieldset>

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </form>
    </div>
  );
}
