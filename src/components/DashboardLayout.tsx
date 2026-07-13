import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { api, type ViinService } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { hasService } from '../lib/services';

const ASSISTANT_NAV = [
  { to: '/dashboard', label: 'Overview', end: true },
  { to: '/dashboard/profile', label: 'Profile' },
  { to: '/dashboard/tasks', label: 'Tasks' },
  { to: '/dashboard/notifications', label: 'Notifications' },
  { to: '/dashboard/memory', label: 'Memory' },
  { to: '/dashboard/briefings', label: 'Briefings' },
  { to: '/dashboard/subscription', label: 'Subscription' },
  { to: '/dashboard/integrations', label: 'Integrations' },
];

const TRADING_NAV = [{ to: '/dashboard/trading-bot', label: 'Trading Bot', end: false }];

export function DashboardLayout() {
  const { user, token, refreshUser } = useAuth();
  const [enrolling, setEnrolling] = useState<ViinService | null>(null);
  const showAssistant = hasService(user, 'assistant');
  const showTrading = hasService(user, 'trading');
  const nav = [
    ...(showAssistant ? ASSISTANT_NAV : [{ to: '/dashboard/profile', label: 'Profile', end: false }]),
    ...(showTrading ? TRADING_NAV : []),
  ];

  async function enroll(service: ViinService) {
    if (!token || enrolling) return;
    setEnrolling(service);
    try {
      await api.enrollServices(token, [service]);
      await refreshUser();
    } finally {
      setEnrolling(null);
    }
  }

  return (
    <div className="dashboard">
      <aside className="dashboard-sidebar">
        <div className="dashboard-sidebar-head">
          <h2>{showTrading && !showAssistant ? 'Trading' : 'Control Center'}</h2>
          <p>
            {showTrading && !showAssistant
              ? 'Manage your trading bot'
              : 'Configure your task assistant'}
          </p>
        </div>
        <nav className="dashboard-nav">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `dashboard-nav-link${isActive ? ' dashboard-nav-link--active' : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="dashboard-sidebar-foot">
          {!showTrading && (
            <>
              <p className="dash-hint" style={{ marginBottom: '0.75rem' }}>
                Want markets too?
              </p>
              <button
                type="button"
                className="btn btn-outline btn-sm btn-block"
                onClick={() => enroll('trading')}
                disabled={!!enrolling}
              >
                {enrolling === 'trading' ? 'Adding…' : 'Add Trading Bot'}
              </button>
            </>
          )}
          {!showAssistant && (
            <>
              <p className="dash-hint" style={{ margin: '0.75rem 0' }}>
                Need task help too?
              </p>
              <button
                type="button"
                className="btn btn-outline btn-sm btn-block"
                onClick={() => enroll('assistant')}
                disabled={!!enrolling}
              >
                {enrolling === 'assistant' ? 'Adding…' : 'Add Task Assistant'}
              </button>
            </>
          )}
          <span className="dashboard-user" style={{ display: 'block', marginTop: '1rem' }}>
            {user?.fullname}
          </span>
        </div>
      </aside>
      <div className="dashboard-content">
        <Outlet />
      </div>
    </div>
  );
}
