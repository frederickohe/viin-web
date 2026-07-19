import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, type UserProfile } from '../api/client';

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<UserProfile>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: UserProfile | null) => void;
  setToken: (token: string) => void;
}

const AuthContext = createContext<AuthState | null>(null);

const TOKEN_KEY = 'viin_access_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(
    () => localStorage.getItem(TOKEN_KEY),
  );
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const setToken = useCallback((t: string) => {
    localStorage.setItem(TOKEN_KEY, t);
    setTokenState(t);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) {
      setUser(null);
      return;
    }
    const profile = await api.getMe(token);
    setUser(profile);
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const profile = await api.getMe(token);
        if (!cancelled) setUser(profile);
      } catch {
        if (!cancelled) {
          localStorage.removeItem(TOKEN_KEY);
          setTokenState(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const res = await api.signIn(email, password);
      setToken(res.access_token);
      const profile = await api.getMe(res.access_token);
      setUser(profile);
      return profile;
    },
    [setToken],
  );

  const signOut = useCallback(async () => {
    if (token) {
      try {
        await api.signOut(token);
      } catch {
        /* ignore */
      }
    }
    localStorage.removeItem(TOKEN_KEY);
    setTokenState(null);
    setUser(null);
  }, [token]);

  const value = useMemo(
    () => ({ token, user, loading, signIn, signOut, refreshUser, setUser, setToken }),
    [token, user, loading, signIn, signOut, refreshUser, setToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
