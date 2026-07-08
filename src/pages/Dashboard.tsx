import { Navigate, Route, Routes } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { Overview } from './dashboard/Overview';
import { ProfileSettings } from './dashboard/ProfileSettings';
import { Tasks } from './dashboard/Tasks';
import { Notifications } from './dashboard/Notifications';
import { Memory } from './dashboard/Memory';
import { Briefings } from './dashboard/Briefings';
import { Subscription } from './dashboard/Subscription';
import { Integrations } from './dashboard/Integrations';
import { TradingBot } from './dashboard/TradingBot';

export function Dashboard() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<Overview />} />
        <Route path="profile" element={<ProfileSettings />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="memory" element={<Memory />} />
        <Route path="briefings" element={<Briefings />} />
        <Route path="subscription" element={<Subscription />} />
        <Route path="integrations" element={<Integrations />} />
        <Route path="trading-bot" element={<TradingBot />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
