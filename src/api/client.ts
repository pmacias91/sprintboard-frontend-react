// The services use this transport. MSW currently handles every /api request locally.
import { sessionStore } from '../lib/session';
const API_BASE_PATH = '/api';

async function request<TResponse>(
  path: string,
  options: RequestInit = {},
): Promise<TResponse> {
  const headers = new Headers(options.headers);
  const sessionId = sessionStore.getSessionId();
  if (sessionId) {
    headers.set('X-Demo-Session', sessionId);
  }

  if (options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${window.location.origin}${API_BASE_PATH}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error: { message?: string } = await response.json().catch(() => ({}));

    throw new Error(error.message || 'Something went wrong. Please try again.');
  }

  const data: TResponse = await response.json();
  if (sessionStore.getSessionId() !== sessionId) {
    throw new Error('Your session has ended. Sign in again to continue.');
  }
  return data;
}

export const httpClient = {
  get<TResponse>(path: string, signal?: AbortSignal): Promise<TResponse> {
    return request<TResponse>(path, { signal });
  },

  post<TResponse>(path: string, body?: unknown): Promise<TResponse> {
    return request<TResponse>(path, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  },

  patch<TResponse>(path: string, body: unknown): Promise<TResponse> {
    return request<TResponse>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  delete<TResponse>(path: string): Promise<TResponse> {
    return request<TResponse>(path, { method: 'DELETE' });
  },
};
