import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError, api, type TradingEquity, type TradingStatus } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export function TradingBot() {
  const { token } = useAuth();

  const [status, setStatus] = useState<TradingStatus | null>(null);
  const [equities, setEquities] = useState<TradingEquity[]>([]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [symbol, setSymbol] = useState('');
  const [levels, setLevels] = useState(5);
  const [drawdownPercent, setDrawdownPercent] = useState(5);

  const [chatInput, setChatInput] = useState('');
  const [chatLog, setChatLog] = useState<{ role: 'you' | 'assistant'; content: string }[]>([]);

  const alpacaReady = useMemo(() => Boolean(status?.alpaca_configured), [status]);

  const loadAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const [st, eq] = await Promise.all([api.getTradingStatus(token), api.getTradingEquities(token)]);
      setStatus(st);
      setEquities(eq.equities);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load trading bot status.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function handleAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const created = await api.addTradingEquity(token, {
        symbol,
        levels,
        drawdown_percent: drawdownPercent,
      });
      setMessage(`Added ${created.symbol}.`);
      setSymbol('');
      await loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add equity.');
    } finally {
      setBusy(false);
    }
  }

  async function handleToggle(sym: string) {
    if (!token) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const res = await api.toggleTradingEquity(token, sym);
      setMessage(`${res.symbol} is now ${res.status}.`);
      await loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to toggle equity.');
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(sym: string) {
    if (!token) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api.removeTradingEquity(token, sym);
      setMessage(`Removed ${sym}.`);
      await loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to remove equity.');
    } finally {
      setBusy(false);
    }
  }

  async function handleStartStop() {
    if (!token) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      if (status?.running) {
        await api.stopTradingBot(token);
        setMessage('Trading bot stopped.');
      } else {
        await api.startTradingBot(token);
        setMessage('Trading bot started.');
      }
      await loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update trading bot.');
    } finally {
      setBusy(false);
    }
  }

  async function handleChat(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    const text = chatInput.trim();
    if (!text) return;
    setChatInput('');
    setBusy(true);
    setError('');
    setMessage('');
    setChatLog((prev) => [...prev, { role: 'you', content: text }]);
    try {
      const res = await api.tradingChat(token, { message: text });
      setChatLog((prev) => [...prev, { role: 'assistant', content: res.response }]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Trading chat failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dash-page">
      <header className="dash-header">
        <h1>Trading Bot</h1>
        <p>Manage equities, toggle systems, and ask the bot for portfolio insights.</p>
      </header>

      {message && <div className="alert alert-info">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <p className="dash-muted">Loading…</p>
      ) : (
        <>
          <section className="dash-card">
            <div className="integration-panel__header">
              <div>
                <h3>Runner</h3>
                <p className="dash-muted">
                  Status: {status?.running ? 'Running' : 'Stopped'} • Interval: {status?.interval_seconds ?? 5}s
                </p>
                <p className="dash-muted">
                  Alpaca: {alpacaReady ? 'Configured' : 'Not configured'}
                </p>
              </div>
              <div className="integration-panel__actions">
                <button
                  type="button"
                  className={`btn btn-sm ${status?.running ? 'btn-ghost' : 'btn-primary'}`}
                  onClick={handleStartStop}
                  disabled={busy || !alpacaReady}
                  title={!alpacaReady ? 'Set ALPACA_API_KEY/ALPACA_API_SECRET on backend.' : undefined}
                >
                  {status?.running ? 'Stop bot' : 'Start bot'}
                </button>
              </div>
            </div>
          </section>

          <section className="dash-card">
            <h3>Add equity</h3>
            <form onSubmit={handleAdd} className="dash-form">
              <label>
                Symbol
                <input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="AAPL" />
              </label>
              <label>
                Levels
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={levels}
                  onChange={(e) => setLevels(Number(e.target.value))}
                />
              </label>
              <label>
                Drawdown %
                <input
                  type="number"
                  min={0.1}
                  max={99}
                  step={0.1}
                  value={drawdownPercent}
                  onChange={(e) => setDrawdownPercent(Number(e.target.value))}
                />
              </label>
              <button type="submit" className="btn btn-outline btn-sm" disabled={busy}>
                Add
              </button>
            </form>
          </section>

          <section className="dash-card">
            <h3>Equities</h3>
            {equities.length === 0 ? (
              <p className="dash-muted">No equities yet.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th>Position</th>
                      <th>Entry price</th>
                      <th>Levels</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {equities.map((eq) => (
                      <tr key={eq.symbol}>
                        <td>{eq.symbol}</td>
                        <td>{eq.position}</td>
                        <td>{eq.entry_price ? eq.entry_price.toFixed(2) : '—'}</td>
                        <td style={{ maxWidth: 420, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {Object.keys(eq.levels ?? {}).length ? JSON.stringify(eq.levels) : '—'}
                        </td>
                        <td>{eq.status}</td>
                        <td style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleToggle(eq.symbol)}
                            disabled={busy}
                          >
                            Toggle
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => handleRemove(eq.symbol)}
                            disabled={busy}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="dash-card">
            <h3>Portfolio chat</h3>
            <form onSubmit={handleChat} className="dash-form">
              <label>
                Ask a question
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="How is my risk exposure right now?"
                />
              </label>
              <button type="submit" className="btn btn-primary btn-sm" disabled={busy || !alpacaReady}>
                Send
              </button>
            </form>
            {chatLog.length > 0 && (
              <div className="dash-chatlog" style={{ marginTop: 12 }}>
                {chatLog.map((item, idx) => (
                  <p key={idx} className="dash-muted" style={{ whiteSpace: 'pre-wrap' }}>
                    <strong>{item.role === 'you' ? 'You' : 'Bot'}:</strong> {item.content}
                  </p>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

