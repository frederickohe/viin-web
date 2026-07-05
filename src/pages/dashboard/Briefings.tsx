import { useEffect, useState } from 'react';
import { api, ApiError, type Briefing } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

type BriefingTab = 'daily' | 'weekly' | 'monthly';

export function Briefings() {
  const { token } = useAuth();
  const [daily, setDaily] = useState<Briefing | null>(null);
  const [weekly, setWeekly] = useState<Briefing | null>(null);
  const [monthly, setMonthly] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<BriefingTab>('daily');

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [d, w, m] = await Promise.all([
          api.getDailyBriefing(token),
          api.getWeeklyBriefing(token),
          api.getMonthlyBriefing(token),
        ]);
        if (!cancelled) {
          setDaily(d);
          setWeekly(w);
          setMonthly(m);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load briefings');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const byTab: Record<BriefingTab, Briefing | null> = {
    daily,
    weekly,
    monthly,
  };
  const active = byTab[tab];

  return (
    <div className="dash-page">
      <header className="dash-header">
        <h1>Briefings</h1>
        <p>
          Preview what Viin will include in your daily, weekly, and monthly task summaries.
          Ask for a briefing in chat with &ldquo;daily briefing&rdquo;, &ldquo;weekly briefing&rdquo;,
          or &ldquo;monthly overview&rdquo;.
        </p>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="dash-tabs">
        <button
          type="button"
          className={`dash-tab${tab === 'daily' ? ' dash-tab--active' : ''}`}
          onClick={() => setTab('daily')}
        >
          Daily {daily ? `(${daily.item_count})` : ''}
        </button>
        <button
          type="button"
          className={`dash-tab${tab === 'weekly' ? ' dash-tab--active' : ''}`}
          onClick={() => setTab('weekly')}
        >
          Weekly {weekly ? `(${weekly.item_count})` : ''}
        </button>
        <button
          type="button"
          className={`dash-tab${tab === 'monthly' ? ' dash-tab--active' : ''}`}
          onClick={() => setTab('monthly')}
        >
          Monthly {monthly ? `(${monthly.item_count})` : ''}
        </button>
      </div>

      <section className="dash-card">
        {loading ? (
          <p className="dash-muted">Generating briefing…</p>
        ) : active ? (
          <>
            <div className="dash-briefing-meta">
              <span className="dash-badge">{active.period} briefing</span>
              <span className="dash-muted">{active.item_count} item{active.item_count !== 1 ? 's' : ''}</span>
            </div>
            <pre className="dash-briefing-full">{active.body}</pre>
          </>
        ) : (
          <p className="dash-muted">No briefing available.</p>
        )}
      </section>
    </div>
  );
}
