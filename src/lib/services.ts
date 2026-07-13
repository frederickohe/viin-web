import type { ViinService, UserProfile } from '../api/client';

export function parseServiceParam(value: string | null | undefined): ViinService {
  return value === 'trading' ? 'trading' : 'assistant';
}

export function userServices(user: UserProfile | null | undefined): ViinService[] {
  const services = user?.services;
  if (Array.isArray(services) && services.length > 0) {
    return services.filter((s): s is ViinService => s === 'assistant' || s === 'trading');
  }
  return ['assistant'];
}

export function hasService(user: UserProfile | null | undefined, service: ViinService): boolean {
  return userServices(user).includes(service);
}

export function defaultDashboardPath(user: UserProfile | null | undefined): string {
  const services = userServices(user);
  if (services.includes('trading') && !services.includes('assistant')) {
    return '/dashboard/trading-bot';
  }
  return '/dashboard';
}

export function serviceLabel(service: ViinService): string {
  return service === 'trading' ? 'Trading Bot' : 'Task Assistant';
}
