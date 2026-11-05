import type { AdminSession } from '../types';

const STORAGE_KEY = 'grubbix.admin.session';

let current: AdminSession | null = read();
const listeners = new Set<() => void>();

function read(): AdminSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AdminSession>;
    if (!parsed.accessToken || !parsed.refreshToken || !parsed.admin?.id) return null;
    return parsed as AdminSession;
  } catch {
    return null;
  }
}

function emit() {
  for (const listener of listeners) listener();
}

export function getSession(): AdminSession | null {
  return current;
}

export function persistSession(session: AdminSession): void {
  current = session;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  emit();
}

export function clearSession(): void {
  current = null;
  window.localStorage.removeItem(STORAGE_KEY);
  emit();
}

export function subscribeToSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
