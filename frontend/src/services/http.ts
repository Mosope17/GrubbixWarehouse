import type { AdminSession } from '../types';
import { clearSession, getSession, persistSession } from './session';

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000').replace(/\/+$/, '');

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  formData?: FormData;
  auth?: boolean;
  signal?: AbortSignal;
};

async function parseError(response: Response): Promise<ApiError> {
  try {
    const payload = (await response.json()) as {
      error?: { code?: string; message?: string; details?: unknown };
    };
    const error = payload.error;
    return new ApiError(
      response.status,
      error?.code ?? 'REQUEST_FAILED',
      error?.message ?? 'The request could not be completed.',
      error?.details,
    );
  } catch {
    return new ApiError(response.status, 'REQUEST_FAILED', 'The request could not be completed.');
  }
}

async function refreshSession(refreshToken: string): Promise<AdminSession | null> {
  try {
    const response = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) return null;
    const session = (await response.json()) as AdminSession;
    if (!session.accessToken) return null;
    persistSession(session);
    return session;
  } catch {
    return null;
  }
}

function buildInit(options: RequestOptions, token?: string): RequestInit {
  const headers: Record<string, string> = {};
  let body: BodyInit | undefined;

  if (options.formData) {
    body = options.formData;
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  if (token) headers.Authorization = `Bearer ${token}`;

  return { method: options.method ?? 'GET', headers, body, signal: options.signal };
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const auth = options.auth === true;
  let session = auth ? getSession() : null;

  if (auth && !session) {
    throw new ApiError(401, 'NO_SESSION', 'Please sign in to continue.');
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, buildInit(options, session?.accessToken));
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(0, 'NETWORK_ERROR', 'Could not reach the server. Check your connection.');
  }

  if (response.status === 401 && auth && session) {
    const refreshed = await refreshSession(session.refreshToken);
    if (!refreshed) {
      clearSession();
      throw new ApiError(401, 'SESSION_EXPIRED', 'Your session has expired. Please sign in again.');
    }
    session = refreshed;
    try {
      response = await fetch(`${API_BASE}${path}`, buildInit(options, session.accessToken));
    } catch {
      throw new ApiError(0, 'NETWORK_ERROR', 'Could not reach the server. Check your connection.');
    }
  }

  if (!response.ok) throw await parseError(response);
  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
}
