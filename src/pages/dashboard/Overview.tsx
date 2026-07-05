import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export function Overview() {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reminderCount, setReminderCount] = useState(0);
  const [todoCount, setTodoCount] = useState(0);
  const [planName, setPlanName] = useState('—');
  const [briefingPreview, setBriefingPreview] = useState('');

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    (async () => {
      try {
        const [reminders, lists, sub, briefing] = await Promise.all([
          api.getReminders(token, 'SCHEDULED'),
          api.getLists(token),
          api.getSubscription(token),
          api.getDailyBriefing(token),
        ]);
        if (cancelled) return;
        setReminderCount(reminders.length);
        setTodoCount(
          lists.reduce(
            (n, l) => n + l.items.filter((i) => !i.completed_at).length,
            0,
          ),
        );
        setPlanName(sub.plan_name || (sub.has_active_subscription ? 'Active' : 'Free'));
        setBriefingPreview(briefing.body.slice(0, 280) + (briefing.body.length > 280 ? '…' : ''));
      } catch {
        /* best effort */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const firstName = user?.fullname?.split(' ')[0] || 'there';

  return (
    <div className="dash-page">
      <header className="dash-header">
        <h1>Welcome back, {firstName}</h1>
        <p>Manage your Viin task assistant from one place.</p>
      </header>

      <div className="dash-stats">
        <div className="dash-stat-card">
          <span className="dash-stat-label">Scheduled reminders</span>
          <span className="dash-stat-value">{loading ? '—' : reminderCount}</span>
        </div>
        <div className="dash-stat-card">
          <span className="dash-stat-label">Open todos</span>
          <span className="dash-stat-value">{loading ? '—' : todoCount}</span>
        </div>
        <div className="dash-stat-card">
          <span className="dash-stat-label">Plan</span>
          <span className="dash-stat-value dash-stat-value--sm">{loading ? '—' : planName}</span>
        </div>
      </div>

      <div className="dash-grid">
        <section className="dash-card">
          <h3>Quick actions</h3>
          <div className="dash-actions">
            <Link to="/dashboard/tasks" className="btn btn-outline btn-sm">
              Add task or reminder
            </Link>
            <Link to="/dashboard/agents" className="btn btn-outline btn-sm">
              Configure agents
            </Link>
            <Link to="/chat" className="btn btn-primary btn-sm">
              Open assistant chat
            </Link>
          </div>
        </section>

        <section className="dash-card">
          <h3>Today's briefing</h3>
          {loading ? (
            <p className="dash-muted">Loading…</p>
          ) : briefingPreview ? (
            <pre className="dash-briefing-preview">{briefingPreview}</pre>
          ) : (
            <p className="dash-muted">No tasks scheduled for today.</p>
          )}
          <Link to="/dashboard/briefings" className="dash-link">
            View full briefing →
          </Link>
        </section>

        <section className="dash-card">
          <h3>Assistant context</h3>
          <dl className="dash-dl">
            <div>
              <dt>Company</dt>
              <dd>{user?.company || 'Not set'}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{user?.occupation || 'Not set'}</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>{user?.location || 'Not set'}</dd>
            </div>
          </dl>
          <Link to="/dashboard/profile" className="dash-link">
            Update profile →
          </Link>
        </section>
      </div>
    </div>
  );
}
