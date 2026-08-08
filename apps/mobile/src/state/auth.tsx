/**
 * Session context for the mobile app: loads the stored token on launch, signs
 * in/signs out, and auto-refreshes an expired access token exactly once per
 * request before giving up.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch, ApiError, refreshSession, signIn as apiSignIn, type ApiOptions } from '@/api/client';
import { loadSession, persistSession } from '@/api/token-store';
import type { Session } from '@/api/types';

export type AuthStatus = 'loading' | 'authed' | 'guest';

export interface AuthContextValue {
  session: Session | null;
  status: AuthStatus;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  isAdmin: boolean;
  isStaff: boolean;
  isClient: boolean;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  /** Rotates the session's tokens; returns the next session or null on failure. */
  refreshTokens(): Promise<Session | null>;
  /** Fires an authenticated call, retrying once after a token refresh on 401. */
  request<T>(path: string, options?: ApiOptions): Promise<T>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const sessionRef = useRef<Session | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadSession()
      .then((stored) => {
        if (cancelled) return;
        sessionRef.current = stored;
        setSession(stored);
        setStatus(stored ? 'authed' : 'guest');
      })
      .catch(() => {
        if (!cancelled) setStatus('guest');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const signOut = useCallback(async () => {
    await persistSession(null);
    sessionRef.current = null;
    setSession(null);
    setStatus('guest');
  }, []);

  const refreshTokens = useCallback(async (): Promise<Session | null> => {
    const current = sessionRef.current;
    if (!current?.refreshToken) return null;
    try {
      const tokens = await refreshSession(current.refreshToken);
      const next: Session = { ...current, ...tokens };
      await persistSession(next);
      sessionRef.current = next;
      setSession(next);
      return next;
    } catch {
      sessionRef.current = null;
      await persistSession(null);
      setSession(null);
      setStatus('guest');
      return null;
    }
  }, []);

  const request = useCallback(
    async <T,>(path: string, options: ApiOptions = {}): Promise<T> => {
      const current = sessionRef.current;
      if (!current?.accessToken) throw new ApiError('Not signed in.', 401);
      try {
        return await apiFetch<T>(path, { ...options, token: current.accessToken });
      } catch (error) {
        // Single refresh-and-retry for an expired access token.
        if (error instanceof ApiError && error.status === 401) {
          const next = await refreshTokens();
          if (next?.accessToken) {
            return apiFetch<T>(path, { ...options, token: next.accessToken });
          }
        }
        throw error;
      }
    },
    [refreshTokens],
  );

  const signIn = useCallback(async (email: string, password: string) => {
    const created = await apiSignIn(email, password);
    await persistSession(created);
    sessionRef.current = created;
    setSession(created);
    setStatus('authed');
  }, []);

  const roles = useMemo(() => session?.user.roles ?? [], [session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      status,
      firstName: session?.user.firstName ?? '',
      lastName: session?.user.lastName ?? '',
      email: session?.user.email ?? '',
      roles,
      isAdmin: roles.some((r) => r.includes('ADMIN')),
      isStaff: roles.some((r) => r === 'STAFF' || r === 'EMPLOYEE'),
      isClient: roles.some((r) => r === 'CLIENT'),
      signIn,
      signOut,
      refreshTokens,
      request,
    }),
    [session, status, roles, signIn, signOut, refreshTokens, request],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>.');
  return value;
}