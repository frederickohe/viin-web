import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const AGENT_LABELS: Record<string, string> = {
  config_agent: 'Configuration',
  email_agent: 'Email',
  chatbot_agent: 'Chatbot',
  image_generation_agent: 'Image generation',
  video_generation_agent: 'Video generation',
  web_search_agent: 'Web search',
};

const AGENT_DESCRIPTIONS: Record<string, string> = {
  config_agent: 'Manages your assistant settings and preferences.',
  email_agent: 'Sends emails on your behalf. Requires a sender email address.',
  chatbot_agent: 'Handles conversational responses across channels.',
  image_generation_agent: 'Creates images from your prompts.',
  video_generation_agent: 'Generates video content from descriptions.',
  web_search_agent: 'Searches the web for up-to-date information.',
};

const REQUIRED_PARAMS: Record<string, string[]> = {
  email_agent: ['sender_email'],
};

export function Agents() {
  const { token } = useAuth();
  const [agents, setAgents] = useState<Record<string, { params?: Record<string, string>; status?: string }>>({});
  const [available, setAvailable] = useState<string[]>([]);
  const [subscriptionAgents, setSubscriptionAgents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [params, setParams] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [agentData, sub] = await Promise.all([
        api.getAgents(token),
        api.getSubscription(token),
      ]);
      setAgents(agentData.agents);
      setAvailable(agentData.available_agents);
      setSubscriptionAgents(sub.agents || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  function startEdit(name: string) {
    const cfg = agents[name] || {};
    const required = REQUIRED_PARAMS[name] || [];
    const initial: Record<string, string> = {};
    for (const key of required) {
      initial[key] = cfg.params?.[key] || '';
    }
    setParams(initial);
    setEditing(name);
    setError('');
    setSuccess('');
  }

  async function handleSave(name: string) {
    if (!token) return;
    setSaving(true);
    setError('');
    try {
      const result = await api.updateAgent(token, name, params, 'active');
      setAgents(result.agents);
      setEditing(null);
      setSuccess(`${AGENT_LABELS[name] || name} configured successfully.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  const displayAgents = available.length ? available : Object.keys(AGENT_LABELS);

  return (
    <div className="dash-page">
      <header className="dash-header">
        <h1>Agent configuration</h1>
        <p>
          Enable and configure the specialized agents your subscription includes.
          Viin routes tasks to the right agent automatically.
        </p>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-info">{success}</div>}

      {loading ? (
        <p className="dash-muted">Loading agents…</p>
      ) : (
        <div className="dash-agent-grid">
          {displayAgents.map((name) => {
            const cfg = agents[name];
            const entitled = subscriptionAgents.length === 0 || subscriptionAgents.includes(name);
            const isActive = cfg?.status === 'active';
            const required = REQUIRED_PARAMS[name] || [];

            return (
              <article key={name} className={`dash-card dash-agent-card${!entitled ? ' dash-agent-card--locked' : ''}`}>
                <div className="dash-agent-head">
                  <h3>{AGENT_LABELS[name] || name}</h3>
                  <span className={`dash-status dash-status--${isActive ? 'active' : entitled ? 'inactive' : 'locked'}`}>
                    {!entitled ? 'Not in plan' : isActive ? 'Active' : 'Not configured'}
                  </span>
                </div>
                <p className="dash-muted">{AGENT_DESCRIPTIONS[name] || 'Specialized assistant capability.'}</p>

                {cfg?.params && Object.keys(cfg.params).length > 0 && editing !== name && (
                  <dl className="dash-dl dash-dl--compact">
                    {Object.entries(cfg.params).map(([k, v]) => (
                      <div key={k}>
                        <dt>{k.replace(/_/g, ' ')}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                  </dl>
                )}

                {editing === name ? (
                  <div className="dash-form">
                    {required.map((key) => (
                      <label key={key}>
                        {key.replace(/_/g, ' ')}
                        <input
                          value={params[key] || ''}
                          onChange={(e) => setParams((p) => ({ ...p, [key]: e.target.value }))}
                          placeholder={key === 'sender_email' ? 'you@company.com' : ''}
                        />
                      </label>
                    ))}
                    {required.length === 0 && (
                      <p className="dash-muted">No configuration required — click save to activate.</p>
                    )}
                    <div className="dash-inline-actions">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={saving}
                        onClick={() => handleSave(name)}
                      >
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setEditing(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  entitled && (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => startEdit(name)}
                    >
                      {isActive ? 'Edit' : 'Configure'}
                    </button>
                  )
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
