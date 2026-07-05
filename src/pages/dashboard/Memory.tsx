import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { api, ApiError, type MemoryItem } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export function Memory() {
  const { token } = useAuth();
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api.getMemoryItems(token);
      setItems(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load memory');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!token || !text) return;
    setSaving(true);
    setError('');
    try {
      await api.createMemoryItem(token, {
        item_type: 'NOTE',
        title: title || undefined,
        text,
      });
      setTitle('');
      setText('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save note');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!token) return;
    try {
      await api.deleteMemoryItem(token, id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete');
    }
  }

  return (
    <div className="dash-page">
      <header className="dash-header">
        <h1>Memory & notes</h1>
        <p>
          Store notes and context Viin can reference in briefings and conversations.
        </p>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="dash-split">
        <section className="dash-card">
          <h3>Add a note</h3>
          <form className="dash-form" onSubmit={handleCreate}>
            <label>
              Title <span className="optional">(optional)</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short label" />
            </label>
            <label>
              Content
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                placeholder="Information you want Viin to remember…"
                required
              />
            </label>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              Save note
            </button>
          </form>
        </section>

        <section className="dash-card dash-card--grow">
          <h3>Saved notes ({items.length})</h3>
          {loading ? (
            <p className="dash-muted">Loading…</p>
          ) : items.length === 0 ? (
            <p className="dash-muted">No notes yet. Add one here or tell Viin in chat.</p>
          ) : (
            <ul className="dash-list">
              {items.map((item) => (
                <li key={item.id} className="dash-list-item dash-list-item--stack">
                  <div>
                    {item.title && <strong>{item.title}</strong>}
                    <p>{item.text}</p>
                    <span className="dash-badge">{item.item_type}</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleDelete(item.id)}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
