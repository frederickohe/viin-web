import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { hasService } from '../lib/services';
import { Overview } from './dashboard/Overview';
import { ProfileSettings } from './dashboard/ProfileSettings';
import { Tasks } from './dashboard/Tasks';
import { Notifications } from './dashboard/Notifications';
import { Memory } from './dashboard/Memory';
import { Briefings } from './dashboard/Briefings';
import { Subscription } from './dashboard/Subscription';
import { Integrations } from './dashboard/Integrations';
import { TradingBot } from './dashboard/TradingBot';

function DashboardHome() {
  const { user } = useAuth();
  if (hasService(user, 'trading') && !hasService(user, 'assistant')) {
    return <Navigate to="/dashboard/trading-bot" replace />;
  }
  return <Overview />;
}

function TradingBotGate() {
  const { user, token, refreshUser } = useAuth();
  const [enrolling, setEnrolling] = useState(false);

  if (hasService(user, 'trading')) {
    return <TradingBot />;
  }

  return (
    <div className="dash-page">
      <header className="dash-header">
        <h1>Trading Bot</h1>
        <p>This is a separate Viin service. Enroll to unlock charts, equities, and bot controls.</p>
      </header>
      <section className="dash-card">
        <p className="dash-muted">
          You already have a Viin account — add Trading Bot without creating a new signup.
        </p>
        <button
          type="button"
          className="btn btn-primary"
          disabled={enrolling || !token}
          onClick={async () => {
            if (!token || enrolling) return;
            setEnrolling(true);
            try {
              await api.enrollServices(token, ['trading']);
              await refreshUser();
            } finally {
              setEnrolling(false);
            }
          }}
        >
          {enrolling ? 'Enrolling…' : 'Enroll in Trading Bot'}
        </button>
      </section>
    </div>
  );
}

export function Dashboard() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="profile" element={<ProfileSettings />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="memory" element={<Memory />} />
        <Route path="briefings" element={<Briefings />} />
        <Route path="subscription" element={<Subscription />} />
        <Route path="integrations" element={<Integrations />} />
        <Route path="trading-bot" element={<TradingBotGate />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
