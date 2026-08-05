/**
 * Typed HTTP client for the AUTHENTIC J.A. REST API.
 *
 * Dependency-free (uses the global `fetch` and `Headers`), so it runs in the
 * Next.js web app (client + server), the Expo app, and Node alike. Auth tokens
 * are supplied via a static value or a resolver function.
 */

export interface ApiClientOptions {
  baseUrl: string;
  /** Static bearer token, or a resolver returning the current token (or null/undefined). */
  accessToken?: string | (() => string | null | undefined);
  defaultHeaders?: Record<string, string>;
  timeoutMs?: number;
}

export class ApiErrorResponse extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiErrorResponse';
    this.status = status;
    this.details = details;
  }
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

function joinUrl(baseUrl: string, path: string): string {
  if (path.startsWith('http')) return path;
  return `${baseUrl.replace(/\/+$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}

export class ApiClient {
  private readonly fetchImpl: FetchLike;

  constructor(
    private readonly options: ApiClientOptions,
    fetchImpl?: FetchLike,
  ) {
    this.fetchImpl = fetchImpl ?? ((input, init) => fetch(input, init));
  }

  private async resolveToken(): Promise<string | undefined> {
    const token = this.options.accessToken;
    if (typeof token === 'function') return token() ?? undefined;
    return token;
  }

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const url = joinUrl(this.options.baseUrl, path);
    const token = await this.resolveToken();

    const headers = new Headers(this.options.defaultHeaders);
    if (init.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }
    headers.set('Accept', 'application/json');
    if (init.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const controller = new AbortController();
    const timeoutMs = this.options.timeoutMs ?? 15_000;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await this.fetchImpl(url, { ...init, headers, signal: controller.signal });

      if (!response.ok) {
        let message = `Request failed with status ${response.status}`;
        let details: unknown;
        try {
          const body = (await response.json()) as { message?: string; details?: unknown };
          if (typeof body?.message === 'string' && body?.message) message = body.message;
          details = body?.details;
        } catch {
          // Non-JSON error body; fall back to the status-based message.
        }
        throw new ApiErrorResponse(message, response.status, details);
      }

      if (response.status === 204) return undefined as T;
      const contentType = response.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) return (await response.json()) as T;
      return (await response.text()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  get<T>(path: string, init?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...init, method: 'GET' });
  }

  post<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      ...init,
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  put<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      ...init,
      method: 'PUT',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  patch<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      ...init,
      method: 'PATCH',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  delete<T>(path: string, init?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...init, method: 'DELETE' });
  }
}