import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { api, ApiError, type MemoryList, type Reminder } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function Tasks() {
  const { token } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [lists, setLists] = useState<MemoryList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'reminders' | 'todos'>('reminders');

  const [reminderBody, setReminderBody] = useState('');
  const [reminderDue, setReminderDue] = useState('');
  const [excludeFromPeriodBriefings, setExcludeFromPeriodBriefings] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newTodoText, setNewTodoText] = useState('');
  const [selectedListId, setSelectedListId] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [r, l] = await Promise.all([
        api.getReminders(token),
        api.getLists(token),
      ]);
      setReminders(r);
      setLists(l);
      if (!selectedListId && l.length) setSelectedListId(l[0].id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [token, selectedListId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreateReminder(e: FormEvent) {
    e.preventDefault();
    if (!token || !reminderBody || !reminderDue) return;
    setSaving(true);
    setError('');
    try {
      await api.createReminder(token, {
        body: reminderBody,
        due_at: new Date(reminderDue).toISOString(),
        delivery: {
          channels: ['chat'],
          ...(excludeFromPeriodBriefings
            ? { exclude_from_period_briefings: true }
            : {}),
        },
      });
      setReminderBody('');
      setReminderDue('');
      setExcludeFromPeriodBriefings(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create reminder');
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel(id: string) {
    if (!token) return;
    try {
      await api.cancelReminder(token, id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to cancel');
    }
  }

  async function handleCreateList(e: FormEvent) {
    e.preventDefault();
    if (!token || !newListName) return;
    setSaving(true);
    try {
      const list = await api.createList(token, newListName);
      setNewListName('');
      setSelectedListId(list.id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create list');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddTodo(e: FormEvent) {
    e.preventDefault();
    if (!token || !selectedListId || !newTodoText) return;
    setSaving(true);
    try {
      await api.addListItem(token, selectedListId, newTodoText);
      setNewTodoText('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add todo');
    } finally {
      setSaving(false);
    }
  }

  async function handleComplete(listId: string, itemId: string) {
    if (!token) return;
    try {
      await api.completeListItem(token, listId, itemId);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to complete');
    }
  }

  const scheduled = reminders.filter((r) => r.status === 'SCHEDULED');

  return (
    <div className="dash-page">
      <header className="dash-header">
        <h1>Tasks & reminders</h1>
        <p>Create deadlines, recurring reminders, and open todo lists for your task assistant.</p>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="dash-tabs">
        <button
          type="button"
          className={`dash-tab${tab === 'reminders' ? ' dash-tab--active' : ''}`}
          onClick={() => setTab('reminders')}
        >
          Reminders ({scheduled.length})
        </button>
        <button
          type="button"
          className={`dash-tab${tab === 'todos' ? ' dash-tab--active' : ''}`}
          onClick={() => setTab('todos')}
        >
          Todo lists ({lists.length})
        </button>
      </div>

      {tab === 'reminders' && (
        <div className="dash-split">
          <section className="dash-card">
            <h3>New reminder</h3>
            <form className="dash-form" onSubmit={handleCreateReminder}>
              <label>
                What to remind you about
                <input
                  value={reminderBody}
                  onChange={(e) => setReminderBody(e.target.value)}
                  placeholder="e.g. Submit quarterly report"
                  required
                />
              </label>
              <label>
                Due date & time
                <input
                  type="datetime-local"
                  value={reminderDue}
                  onChange={(e) => setReminderDue(e.target.value)}
                  required
                />
              </label>
              <label className="dash-toggle">
                <input
                  type="checkbox"
                  checked={excludeFromPeriodBriefings}
                  onChange={(e) => setExcludeFromPeriodBriefings(e.target.checked)}
                />
                <span>Exclude from weekly & monthly briefings (one-time only)</span>
              </label>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                Create reminder
              </button>
            </form>
          </section>

          <section className="dash-card dash-card--grow">
            <h3>Scheduled reminders</h3>
            {loading ? (
              <p className="dash-muted">Loading…</p>
            ) : scheduled.length === 0 ? (
              <p className="dash-muted">No scheduled reminders. Add one or ask Viin in chat.</p>
            ) : (
              <ul className="dash-list">
                {scheduled.map((r) => (
                  <li key={r.id} className="dash-list-item">
                    <div>
                      <strong>{r.title || r.body}</strong>
                      {r.title && <p className="dash-muted">{r.body}</p>}
                      <span className="dash-badge">{formatDate(r.due_at)}</span>
                      {r.rrule && <span className="dash-badge dash-badge--recurring">Recurring</span>}
                      {!r.rrule &&
                        Boolean(
                          (r.delivery as { exclude_from_period_briefings?: boolean } | undefined)
                            ?.exclude_from_period_briefings,
                        ) && (
                          <span className="dash-badge dash-badge--muted">
                            Excluded from weekly/monthly
                          </span>
                        )}
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleCancel(r.id)}
                    >
                      Cancel
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {tab === 'todos' && (
        <div className="dash-split">
          <section className="dash-card">
            <h3>New list</h3>
            <form className="dash-form" onSubmit={handleCreateList}>
              <label>
                List name
                <input
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="e.g. Work tasks"
                  required
                />
              </label>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                Create list
              </button>
            </form>

            {lists.length > 0 && (
              <>
                <h3 className="dash-subhead">Add todo</h3>
                <form className="dash-form" onSubmit={handleAddTodo}>
                  <label>
                    List
                    <select
                      value={selectedListId}
                      onChange={(e) => setSelectedListId(e.target.value)}
                    >
                      {lists.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Task
                    <input
                      value={newTodoText}
                      onChange={(e) => setNewTodoText(e.target.value)}
                      placeholder="What needs doing?"
                      required
                    />
                  </label>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                    Add todo
                  </button>
                </form>
              </>
            )}
          </section>

          <section className="dash-card dash-card--grow">
            <h3>Your lists</h3>
            {loading ? (
              <p className="dash-muted">Loading…</p>
            ) : lists.length === 0 ? (
              <p className="dash-muted">No lists yet. Create one or say &ldquo;add task buy milk&rdquo; in chat.</p>
            ) : (
              lists.map((list) => (
                <div key={list.id} className="dash-list-group">
                  <h4>{list.name}</h4>
                  <ul className="dash-checklist">
                    {list.items.map((item) => (
                      <li key={item.id} className={item.completed_at ? 'dash-checklist--done' : ''}>
                        <label>
                          <input
                            type="checkbox"
                            checked={!!item.completed_at}
                            disabled={!!item.completed_at}
                            onChange={() => handleComplete(list.id, item.id)}
                          />
                          <span>{item.text}</span>
                        </label>
                      </li>
                    ))}
                    {list.items.length === 0 && (
                      <li className="dash-muted">No items in this list</li>
                    )}
                  </ul>
                </div>
              ))
            )}
          </section>
        </div>
      )}
    </div>
  );
}
