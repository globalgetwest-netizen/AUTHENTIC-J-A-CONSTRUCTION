import { cookies } from 'next/headers';

export const ACCESS_COOKIE = 'ajac_at';
export const REFRESH_COOKIE = 'ajac_rt';

const COOKIE_MAX_AGE = 3600; // s — matches the API access-token TTL

export function getApiBase(): string {
  return process.env.API_PUBLIC_URL ?? 'http://localhost:3000';
}

export interface AdminAuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AdminAuthUser;
}

export async function getAccessToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(ACCESS_COOKIE)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(REFRESH_COOKIE)?.value;
}

export async function setAuthCookies(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  const store = await cookies();
  store.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });
  store.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 14, // match the API refresh-token lifetime (2 weeks)
  });
}

export async function clearAuthCookies(): Promise<void> {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}

/** Bearer header value from cookies, or undefined when signed out. */
export async function getBearer(): Promise<Record<string, string> | undefined> {
  const token = await getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

/**
 * Server-to-server proxy call to the API. Attaches the cookie bearer token,
 * and on a 401 transparently refreshes via /auth/refresh and retries once.
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const base = getApiBase();
  const url = `${base}/api/v1${path}`;
  const bearer = await getBearer();

  const headers = new Headers(init.headers);
  if (bearer) headers.set('Authorization', bearer.Authorization);
  // Multipart bodies must keep the browser-generated boundary — never force JSON.
  if (init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const raw = await fetch(url, { ...init, headers, cache: 'no-store' });

  if (raw.status === 401) {
    const refreshed = await tryRefresh(headers);
    if (refreshed) {
      return fetch(url, { ...init, headers, cache: 'no-store' });
    }
  }

  return raw;
}

async function tryRefresh(headers: Headers): Promise<boolean> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return false;

  const base = getApiBase();
  try {
    const res = await fetch(`${base}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    });
    if (!res.ok) return false;

    const data = (await res.json()) as AuthTokens;
    headers.set('Authorization', `Bearer ${data.accessToken}`);
    await setAuthCookies(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}