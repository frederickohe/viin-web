const API_URL = import.meta.env.VITE_API_URL ?? '';

export interface SignUpPayload {
  fullname: string;
  email: string;
  phone: string;
  password: string;
  ghana_card: string;
  company?: string;
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
  enabled: boolean;
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

export interface ChatResponse {
  response: string;
  success: boolean;
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
      detail = body.detail || body.message || JSON.stringify(body);
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

  getPlans: () =>
    request<{ success: boolean; plans: Plan[] }>('/api/v1/subscription/plans'),

  sendMessage: (phone: string, message: string) =>
    request<ChatResponse>('/api/v1/nlu/process', {
      method: 'POST',
      body: JSON.stringify({ phone, message }),
    }),

  signOut: (token: string) =>
    request('/api/v1/auth/signout', { method: 'POST' }, token),
};

export { ApiError };
