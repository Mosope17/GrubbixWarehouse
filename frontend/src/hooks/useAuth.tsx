import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { login as loginRequest, fetchCurrentAdmin } from '../services/admin';
import { ApiError } from '../services/http';
import {
  clearSession,
  getSession,
  persistSession,
  subscribeToSession,
} from '../services/session';
import type { AdminSession } from '../types';

type AuthContextValue = {
  session: AdminSession | null;
  checking: boolean;
  login: (email: string, password: string) => Promise<AdminSession>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(() => getSession());
  const [checking, setChecking] = useState(true);

  useEffect(() => subscribeToSession(() => setSession(getSession())), []);

  useEffect(() => {
    let cancelled = false;

    if (!getSession()) {
      setChecking(false);
      return;
    }

    (async () => {
      try {
        const admin = await fetchCurrentAdmin();
        const current = getSession();
        if (current && !cancelled) persistSession({ ...current, admin });
      } catch (error) {
        // Only drop the session when the server rejects it; a network blip
        // should not sign the administrator out.
        if (
          !cancelled &&
          error instanceof ApiError &&
          (error.status === 401 || error.status === 403)
        ) {
          clearSession();
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const nextSession = await loginRequest(email, password);
    persistSession(nextSession);
    return nextSession;
  }, []);

  const logout = useCallback(() => {
    clearSession();
  }, []);

  const value = useMemo(
    () => ({ session, checking, login, logout }),
    [session, checking, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
