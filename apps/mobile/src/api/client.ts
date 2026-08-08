/**
 * Typed HTTP client for the self-hosted AUTHENTIC J.A. API.
 *
 * `EXPO_PUBLIC_API_URL` is inline at build time by Expo (see `.env.example`);
 * the default targets the same local API the web app uses.
 */
import type {
  ApiErrorBody,
  AuthTokens,
  ClientProfile,
  EmployeeIdCard,
  EmployeeListItem,
  LoginResult,
  NotificationsResult,
  Paginated,
  Payslip,
  Quotation,
  Session,
  StaffProfile,
} from './types';

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  token?: string;
  body?: unknown;
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    accept: 'application/json',
  };
  if (options.body !== undefined) headers['content-type'] = 'application/json';
  if (options.token) headers.authorization = `Bearer ${options.token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError('Cannot reach the AUTHENTIC J.A. server. Check your connection.', 0);
  }

  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const message = (data as ApiErrorBody | null)?.message ?? `Request failed (${res.status}).`;
    throw new ApiError(message, res.status);
  }
  return data as T;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export function login(email: string, password: string): Promise<LoginResult> {
  return apiFetch<LoginResult>('/auth/login', { method: 'POST', body: { email, password } });
}

export function refreshSession(refreshToken: string): Promise<AuthTokens> {
  return apiFetch<AuthTokens>('/auth/refresh', { method: 'POST', body: { refreshToken } });
}

export async function signIn(email: string, password: string): Promise<Session> {
  const result = await login(email, password);
  return {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    user: result.user,
  };
}

// ── Self-scoped profiles & data ───────────────────────────────────────────────

export function staffProfile(session: Session): Promise<StaffProfile> {
  return apiFetch<StaffProfile>('/staff/profile', { token: session.accessToken });
}

export function clientProfile(session: Session): Promise<ClientProfile> {
  return apiFetch<ClientProfile>('/client/profile', { token: session.accessToken });
}

export function staffNotifications(session: Session): Promise<NotificationsResult> {
  return apiFetch<NotificationsResult>('/staff/notifications', { token: session.accessToken });
}

export function staffPayslips(session: Session): Promise<Payslip[]> {
  return apiFetch<Payslip[]>('/staff/payslips', { token: session.accessToken });
}

export function staffPayslip(session: Session, id: string): Promise<Payslip> {
  return apiFetch<Payslip>(`/staff/payslips/${id}`, { token: session.accessToken });
}

export function myEmployeeId(session: Session): Promise<EmployeeIdCard | null> {
  return apiFetch<EmployeeIdCard | null>('/staff/employee-id', { token: session.accessToken });
}

export function clientQuotations(session: Session): Promise<{ data: Quotation[]; meta: { total: number } }> {
  return apiFetch('/client/quotations', { token: session.accessToken });
}

export function clientQuotation(session: Session, id: string): Promise<Quotation> {
  return apiFetch<Quotation>(`/client/quotations/${id}`, { token: session.accessToken });
}

// ── Admin catalog (SUPER_ADMIN / ADMIN) ───────────────────────────────────────

export function employees(session: Session, page = 1, pageSize = 50): Promise<Paginated<EmployeeListItem>> {
  return apiFetch<Paginated<EmployeeListItem>>(
    `/employees?page=${page}&pageSize=${pageSize}`,
    { token: session.accessToken },
  );
}