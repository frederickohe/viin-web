import { Link } from 'react-router-dom';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { api, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  isReminder?: boolean;
}

const REMINDER_POLL_MS = 20_000;

export function Chat() {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: `Hi${user?.fullname ? ` ${user.fullname.split(' ')[0]}` : ''}! I'm Viin, your AI assistant. What can I help you with today?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastSeenRef = useRef<string>('');

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!token) return;

    if (!lastSeenRef.current) {
      lastSeenRef.current = new Date().toISOString();
    }

    let cancelled = false;

    async function pollReminders() {
      if (cancelled || sending || !token) return;
      try {
        const res = await api.getChatUpdates(token, lastSeenRef.current || undefined);
        const incoming = res.messages || [];
        if (!incoming.length) return;

        setMessages((prev) => {
          const existingTexts = new Set(prev.map((m) => m.text));
          const additions = incoming
            .filter((m) => m.content && !existingTexts.has(m.content))
            .map((m) => ({
              id: crypto.randomUUID(),
              role: 'assistant' as const,
              text: m.content,
              isReminder: m.type === 'reminder',
            }));
          return additions.length ? [...prev, ...additions] : prev;
        });

        const latest = incoming
          .map((m) => m.timestamp)
          .filter(Boolean)
          .sort()
          .at(-1);
        if (latest) lastSeenRef.current = latest;
      } catch {
        /* polling is best-effort */
      }
    }

    pollReminders();
    const timer = window.setInterval(pollReminders, REMINDER_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [token, sending]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending || !token) return;

    setInput('');
    setError('');
    setSending(true);

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await api.sendMessage(token, text);
      const reply =
        typeof res.response === 'string'
          ? res.response
          : JSON.stringify(res.response);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', text: reply },
      ]);
      lastSeenRef.current = new Date().toISOString();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to send message.');
    } finally {
      setSending(false);
    }
  }

  if (!user?.phone) {
    return (
      <div className="chat-missing-phone">
        <p>Your account needs a phone number to use the assistant.</p>
        <p>
          <Link to="/dashboard/profile">Add your phone in the dashboard</Link> to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="chat-layout">
      <div className="chat-header">
        <h2>Viin Assistant</h2>
        <span className="chat-status">{sending ? 'Thinking…' : 'Online'}</span>
      </div>

      <div className="chat-messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-bubble chat-bubble--${msg.role}${msg.isReminder ? ' chat-bubble--reminder' : ''}`}
          >
            {msg.text}
          </div>
        ))}
        {sending && (
          <div className="chat-bubble chat-bubble--assistant chat-bubble--typing">
            <span />
            <span />
            <span />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && <div className="chat-error">{error}</div>}

      <form className="chat-input-bar" onSubmit={handleSend}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Viin anything…"
          disabled={sending}
          maxLength={1000}
        />
        <button type="submit" className="btn btn-primary" disabled={sending || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
