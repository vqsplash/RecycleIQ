const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function getErrorMessage(payload: unknown): string {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (typeof record.detail === 'string') return record.detail;
    const messages = Object.entries(record).flatMap(([field, value]) => {
      const entries = Array.isArray(value) ? value : [value];
      return entries.map((entry) => `${field}: ${String(entry)}`);
    });
    if (messages.length) return messages.join(' ');
  }
  return 'The request could not be completed. Please try again.';
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = localStorage.getItem('recycleiq.refresh');
  if (!refresh) return null;
  try {
    const response = await fetch(`${API_BASE}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (!response.ok) throw new Error('Refresh expired');
    const data = (await response.json()) as { access: string };
    localStorage.setItem('recycleiq.access', data.access);
    return data.access;
  } catch {
    localStorage.removeItem('recycleiq.access');
    localStorage.removeItem('recycleiq.refresh');
    return null;
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const access = localStorage.getItem('recycleiq.access');
  if (access) headers.set('Authorization', `Bearer ${access}`);
  if (!(init.body instanceof FormData) && init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (response.status === 401 && access) {
    const renewed = await refreshAccessToken();
    if (renewed) {
      headers.set('Authorization', `Bearer ${renewed}`);
      response = await fetch(`${API_BASE}${path}`, { ...init, headers });
    }
  }

  if (!response.ok) {
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
    throw new ApiError(getErrorMessage(payload), response.status);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string) => apiRequest<T>(path),
  post: <T>(path: string, body: BodyInit | object) =>
    apiRequest<T>(path, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  patch: <T>(path: string, body: object) =>
    apiRequest<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  put: <T>(path: string, body: object) =>
    apiRequest<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
};