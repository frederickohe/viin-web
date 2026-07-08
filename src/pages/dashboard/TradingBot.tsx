import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError, api, type MarketBar, type TradingEquity, type TradingStatus } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { TradingChart } from '../../components/TradingChart';

export function TradingBot() {
  const { token } = useAuth();

  const [status, setStatus] = useState<TradingStatus | null>(null);
  const [equities, setEquities] = useState<TradingEquity[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [timeframe, setTimeframe] = useState('1Day');
  const [bars, setBars] = useState<MarketBar[]>([]);
  const [barsLoading, setBarsLoading] = useState(false);

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

  useEffect(() => {
    if (!selectedSymbol && equities.length) {
      setSelectedSymbol(equities[0]?.symbol ?? '');
    }
  }, [equities, selectedSymbol]);

  const loadBars = useCallback(async () => {
    if (!token) return;
    const sym = selectedSymbol.trim().toUpperCase();
    if (!sym) return;
    setBarsLoading(true);
    setError('');
    try {
      const res = await api.getMarketBars(token, sym, { timeframe, limit: 300 });
      setBars(res.bars ?? []);
    } catch (err) {
      setBars([]);
      setError(err instanceof ApiError ? err.message : 'Failed to load market data.');
    } finally {
      setBarsLoading(false);
    }
  }, [selectedSymbol, timeframe, token]);

  useEffect(() => {
    if (!alpacaReady) return;
    void loadBars();
  }, [alpacaReady, loadBars]);

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

  async function downloadExport(format: 'csv' | 'json') {
    if (!token) return;
    const sym = selectedSymbol.trim().toUpperCase();
    if (!sym) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const url = api.exportMarketBarsUrl(sym, { format, timeframe, limit: 2000 });
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        let detail = res.statusText;
        try {
          const body = await res.json();
          detail = body.detail || body.message || detail;
        } catch {
          /* ignore */
        }
        throw new ApiError(detail, res.status);
      }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${sym}.${timeframe}.bars.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
      setMessage(`Exported ${sym} (${format.toUpperCase()}).`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Export failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dash-page">
      <header className="dash-header">
        <h1>Trading Bot</h1>
        <p>Manage equities, monitor price action, export data, and ask the bot for portfolio insights.</p>
      </header>

      {message && <div className="alert alert-info">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <p className="dash-muted">Loading…</p>
      ) : (
        <>
          <section className="dash-grid dash-grid--trading">
            <div className="dash-card dash-card--chart">
              <div className="integration-panel__header">
                <div>
                  <h3>Chart</h3>
                  <p className="dash-muted">
                    {alpacaReady ? 'Market data via Alpaca' : 'Alpaca not configured on backend'}
                  </p>
                </div>
                <div className="integration-panel__actions">
                  <label className="dash-inline-field">
                    <span>Symbol</span>
                    <select
                      value={selectedSymbol}
                      onChange={(e) => setSelectedSymbol(e.target.value)}
                      disabled={busy}
                      aria-label="Chart symbol"
                    >
                      {equities.map((eq) => (
                        <option key={eq.symbol} value={eq.symbol}>
                          {eq.symbol}
                        </option>
                      ))}
                      {!equities.some((e) => e.symbol === selectedSymbol) && selectedSymbol && (
                        <option value={selectedSymbol}>{selectedSymbol}</option>
                      )}
                    </select>
                  </label>
                  <label className="dash-inline-field">
                    <span>TF</span>
                    <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} disabled={busy}>
                      <option value="1Min">1Min</option>
                      <option value="5Min">5Min</option>
                      <option value="15Min">15Min</option>
                      <option value="1Hour">1Hour</option>
                      <option value="1Day">1Day</option>
                    </select>
                  </label>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => void loadBars()}
                    disabled={busy || barsLoading || !alpacaReady || !selectedSymbol}
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {!alpacaReady ? (
                <p className="dash-muted" style={{ marginTop: 12 }}>
                  Configure `ALPACA_API_KEY` and `ALPACA_API_SECRET` on the backend to enable charting + exports.
                </p>
              ) : barsLoading ? (
                <p className="dash-muted" style={{ marginTop: 12 }}>
                  Loading chart…
                </p>
              ) : bars.length ? (
                <div className="trading-chart">
                  <TradingChart bars={bars} watermark={selectedSymbol} />
                </div>
              ) : (
                <p className="dash-muted" style={{ marginTop: 12 }}>
                  No bars returned.
                </p>
              )}
            </div>

            <div className="dash-card dash-card--export">
              <h3>Export</h3>
              <p className="dash-hint">
                Download OHLCV bars for the selected symbol/timeframe (useful for backtesting, Excel, or audits).
              </p>
              <div className="dash-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => void downloadExport('csv')}
                  disabled={busy || !alpacaReady || !selectedSymbol}
                >
                  Export CSV
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => void downloadExport('json')}
                  disabled={busy || !alpacaReady || !selectedSymbol}
                >
                  Export JSON
                </button>
              </div>
              <div style={{ marginTop: 12 }}>
                <p className="dash-muted">
                  Symbol: <strong>{selectedSymbol || '—'}</strong> • Timeframe: <strong>{timeframe}</strong>
                </p>
              </div>
            </div>
          </section>

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
                            onClick={() => setSelectedSymbol(eq.symbol)}
                            disabled={busy}
                          >
                            View
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

