const API_URL = import.meta.env.VITE_API_URL ?? '';

export interface SignUpPayload {
  fullname: string;
  email: string;
  phone: string;
  password: string;
}

export interface SignUpResponse {
  message: string;
  user_id: string;
  verification_required: boolean;
  otp_sent: boolean;
}

export interface SignInResponse {
  status: string;
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface UserProfile {
  id: string;
  fullname: string;
  email: string;
  phone?: string;
  company?: string;
  occupation?: string;
  organization_workplace?: string;
  location?: string;
  address?: string;
  whatsapp_number?: string;
  linkedin_url?: string;
  profile_picture_url?: string;
  profile_sharing?: boolean;
  in_app_notification?: boolean;
  sms_notification?: boolean;
  enabled: boolean;
  status?: string;
}

export interface UserUpdatePayload {
  fullname?: string;
  phone?: string;
  company?: string;
  occupation?: string;
  organization_workplace?: string;
  location?: string;
  address?: string;
  whatsapp_number?: string;
  linkedin_url?: string;
  profile_sharing?: boolean;
}

export interface NotificationSettingsPayload {
  in_app_notification?: boolean;
  sms_notification?: boolean;
}

export interface Plan {
  id: number | string;
  name: string;
  price: number;
  features: string[];
  agents: string[];
  description?: string;
  is_active?: boolean;
}

export interface SubscriptionStatus {
  has_active_subscription: boolean;
  subscription_id?: number;
  plan_id?: number;
  plan_name?: string;
  plan_price?: number;
  features?: string[];
  agents?: string[];
  amount_paid?: number;
  expires_at?: string;
  days_remaining: number;
  status: string;
}

export interface AgentConfig {
  params?: Record<string, string>;
  status?: string;
}

export interface UserAgents {
  agents: Record<string, AgentConfig>;
  available_agents: string[];
}

export interface Reminder {
  id: string;
  owner_user_id: string;
  title?: string;
  body: string;
  due_at: string;
  timezone?: string;
  rrule?: string;
  status: string;
  delivery: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface MemoryListItem {
  id: string;
  list_id: string;
  position: number;
  text: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface MemoryList {
  id: string;
  owner_user_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  items: MemoryListItem[];
}

export interface MemoryItem {
  id: string;
  owner_user_id: string;
  item_type: string;
  title?: string;
  text?: string;
  url?: string;
  created_at: string;
  updated_at: string;
}

export interface Briefing {
  period: string;
  body: string;
  item_count: number;
}

export interface ChatResponse {
  response: string;
  success: boolean;
}

export interface ChatUpdateMessage {
  role: 'assistant';
  content: string;
  timestamp?: string;
  type?: string;
  reminder_id?: string;
}

export interface ChatUpdatesResponse {
  user_id: string;
  messages: ChatUpdateMessage[];
  success: boolean;
}

export interface GoogleCalendarStatus {
  connected: boolean;
  google_account_email?: string;
  calendar_id?: string;
  reminder_lead_minutes: number;
  last_synced_at?: string;
  last_sync_error?: string;
  enabled: boolean;
}

export interface GoogleCalendarSyncResult {
  synced_events: number;
  reminders_created: number;
  reminders_updated: number;
  reminders_cancelled: number;
}

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      if (typeof body.detail === 'string') {
        detail = body.detail;
      } else if (Array.isArray(body.detail)) {
        detail = body.detail.map((item: { msg?: string }) => item.msg).filter(Boolean).join('. ');
      } else {
        detail = body.message || JSON.stringify(body);
      }
    } catch {
      /* ignore */
    }
    throw new ApiError(String(detail), res.status);
  }

  if (res.status === 204) return {} as T;
  return res.json() as Promise<T>;
}

export const api = {
  signUp: (payload: SignUpPayload) =>
    request<SignUpResponse>('/api/v1/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  signIn: async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/api/v1/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      let detail = 'Login failed';
      try {
        const body = await res.json();
        detail = body.detail || body.message || detail;
      } catch {
        /* ignore */
      }
      throw new ApiError(detail, res.status);
    }
    return res.json() as Promise<SignInResponse>;
  },

  verifyOtp: (phone: string, otp: string) =>
    request<{ success: boolean; message: string; user_id?: string }>(
      '/api/v1/auth/verify-otp',
      { method: 'POST', body: JSON.stringify({ phone, otp }) },
    ),

  resendOtp: (phone: string) =>
    request<{ success: boolean; message: string }>('/api/v1/otp/send', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),

  getMe: (token: string) =>
    request<UserProfile>('/api/v1/user/me', {}, token),

  updateMe: (token: string, payload: UserUpdatePayload) =>
    request<UserProfile>('/api/v1/user/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }, token),

  updateNotificationSettings: (token: string, payload: NotificationSettingsPayload) =>
    request<UserProfile>('/api/v1/user/me/notification-settings', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }, token),

  getAgents: (token: string) =>
    request<UserAgents>('/api/v1/user/me/agents', {}, token),

  updateAgent: (token: string, agentName: string, params: Record<string, string>, status?: string) =>
    request<UserAgents>(`/api/v1/user/me/agents/${agentName}`, {
      method: 'PATCH',
      body: JSON.stringify({ params, status }),
    }, token),

  getPlans: () =>
    request<{ success: boolean; plans: Plan[] }>('/api/v1/subscription/plans'),

  getSubscription: (token: string) =>
    request<SubscriptionStatus>('/api/v1/subscription/me', {}, token),

  getReminders: (token: string, status?: string) => {
    const params = status ? `?status=${status}` : '';
    return request<Reminder[]>(`/api/v1/memory/reminders${params}`, {}, token);
  },

  createReminder: (token: string, payload: {
    body: string;
    due_at: string;
    title?: string;
    rrule?: string;
    delivery?: Record<string, unknown>;
  }) =>
    request<Reminder>('/api/v1/memory/reminders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token),

  cancelReminder: (token: string, reminderId: string) =>
    request<Reminder>(`/api/v1/memory/reminders/${reminderId}/cancel`, {
      method: 'PATCH',
    }, token),

  getLists: (token: string) =>
    request<MemoryList[]>('/api/v1/memory/lists', {}, token),

  createList: (token: string, name: string, description?: string) =>
    request<MemoryList>('/api/v1/memory/lists', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    }, token),

  addListItem: (token: string, listId: string, text: string) =>
    request<MemoryListItem>(`/api/v1/memory/lists/${listId}/items`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }, token),

  completeListItem: (token: string, listId: string, itemId: string) =>
    request<MemoryListItem>(`/api/v1/memory/lists/${listId}/items/${itemId}/complete`, {
      method: 'PATCH',
    }, token),

  getMemoryItems: (token: string) =>
    request<MemoryItem[]>('/api/v1/memory/items', {}, token),

  createMemoryItem: (token: string, payload: { item_type: string; title?: string; text?: string }) =>
    request<MemoryItem>('/api/v1/memory/items', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token),

  deleteMemoryItem: (token: string, itemId: string) =>
    request(`/api/v1/memory/items/${itemId}`, { method: 'DELETE' }, token),

  getDailyBriefing: (token: string) =>
    request<Briefing>('/api/v1/memory/briefing/daily', {}, token),

  getWeeklyBriefing: (token: string) =>
    request<Briefing>('/api/v1/memory/briefing/weekly', {}, token),

  getMonthlyBriefing: (token: string) =>
    request<Briefing>('/api/v1/memory/briefing/monthly', {}, token),

  sendMessage: (token: string, message: string) =>
    request<ChatResponse>(
      '/api/v1/nlu/process',
      {
        method: 'POST',
        body: JSON.stringify({ message }),
      },
      token,
    ),

  getChatUpdates: (token: string, since?: string) => {
    const params = new URLSearchParams();
    if (since) params.set('since', since);
    const qs = params.toString();
    return request<ChatUpdatesResponse>(
      `/api/v1/nlu/chat-updates${qs ? `?${qs}` : ''}`,
      {},
      token,
    );
  },

  getGoogleCalendarStatus: (token: string) =>
    request<GoogleCalendarStatus>('/api/v1/integrations/google-calendar/status', {}, token),

  getGoogleCalendarConnectUrl: (token: string) =>
    request<{ authorization_url: string }>('/api/v1/integrations/google-calendar/connect', {}, token),

  updateGoogleCalendarSettings: (token: string, payload: { reminder_lead_minutes?: number }) =>
    request<GoogleCalendarStatus>('/api/v1/integrations/google-calendar/settings', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }, token),

  syncGoogleCalendar: (token: string) =>
    request<GoogleCalendarSyncResult>('/api/v1/integrations/google-calendar/sync', {
      method: 'POST',
    }, token),

  disconnectGoogleCalendar: (token: string) =>
    request<{ message: string }>('/api/v1/integrations/google-calendar/disconnect', {
      method: 'DELETE',
    }, token),

  signOut: (token: string) =>
    request('/api/v1/auth/signout', { method: 'POST' }, token),
};

export { ApiError };
