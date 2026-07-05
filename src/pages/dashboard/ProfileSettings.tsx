import { type FormEvent, useEffect, useState } from 'react';
import { api, ApiError } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export function ProfileSettings() {
  const { token, user, refreshUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
      await api.updateMe(token, form);
      await refreshUser();
      setSuccess('Profile updated. Your task assistant will use this context in conversations.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
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
