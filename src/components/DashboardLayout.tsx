import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/dashboard', label: 'Overview', end: true },
  { to: '/dashboard/profile', label: 'Profile' },
  { to: '/dashboard/tasks', label: 'Tasks' },
  { to: '/dashboard/notifications', label: 'Notifications' },
  { to: '/dashboard/memory', label: 'Memory' },
  { to: '/dashboard/briefings', label: 'Briefings' },
  { to: '/dashboard/subscription', label: 'Subscription' },
  { to: '/dashboard/integrations', label: 'Integrations' },
];

export function DashboardLayout() {
  const { user } = useAuth();

  return (
    <div className="dashboard">
      <aside className="dashboard-sidebar">
        <div className="dashboard-sidebar-head">
          <h2>Control Center</h2>
          <p>Configure your task assistant</p>
        </div>
        <nav className="dashboard-nav">
          {NAV.map((item) => (
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
          <span className="dashboard-user">{user?.fullname}</span>
        </div>
      </aside>
      <div className="dashboard-content">
        <Outlet />
      </div>
    </div>
  );
}
