import { z } from 'zod';
import { sessionUserSchema, type SessionUser } from '../types/auth';

export const REMEMBER_SESSION_DAYS = 30;

const SESSION_COOKIE = 'sprintboard.session.v3';
const SESSION_SIGNAL_KEY = 'sprintboard.session.changed';
const LEGACY_SESSION_KEY = 'sprintboard.session.v2';
const FIRST_SESSION_KEY = 'sprintboard.session.v1';
const maxTimerDelay = 2_147_483_647;
const sessionSchema = z.object({
  user: sessionUserSchema,
  expiresAt: z.number().int().positive().nullable(),
});

type StoredSession = z.infer<typeof sessionSchema>;
type StorageSource = () => Storage;

const listeners = new Set<() => void>();
let cachedValue = '';
let cachedUser: SessionUser | null = null;
let expiryTimer: ReturnType<typeof setTimeout> | undefined;

function parseSession(value: string | null): StoredSession | null {
  try {
    const result = sessionSchema.safeParse(value ? JSON.parse(value) : null);

    if (
      !result.success ||
      (result.data.expiresAt !== null && result.data.expiresAt <= Date.now())
    ) {
      return null;
    }

    return result.data;
  } catch {
    return null;
  }
}

function readCookieValue(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const prefix = `${SESSION_COOKIE}=`;
  const cookie = document.cookie.split('; ').find((value) => value.startsWith(prefix));
  return cookie?.slice(prefix.length) ?? null;
}

function readSession(): StoredSession | null {
  try {
    const value = readCookieValue();
    return parseSession(value ? decodeURIComponent(value) : null);
  } catch {
    return null;
  }
}

function cookieAttributes(): string {
  return `Path=/; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
}

function writeSessionCookie(session: StoredSession): void {
  const value = encodeURIComponent(JSON.stringify(session));
  const lifetime =
    session.expiresAt === null
      ? ''
      : `; Max-Age=${Math.max(0, Math.ceil((session.expiresAt - Date.now()) / 1000))}`;

  // This frontend demo stores identity only. A real backend should issue an HttpOnly session cookie.
  // No lifetime attribute means a browser-session cookie, shared by all its tabs.
  document.cookie = `${SESSION_COOKIE}=${value}; ${cookieAttributes()}${lifetime}`;

  if (readCookieValue() !== value) {
    throw new Error('The browser could not save the demo session cookie.');
  }
}

function getSnapshot(): SessionUser | null {
  const session = readSession();
  const value = session ? JSON.stringify(session) : '';

  // React requires the same snapshot reference until the stored session changes.
  if (value !== cachedValue) {
    cachedValue = value;
    cachedUser = session?.user ?? null;
  }

  return cachedUser;
}

function removeStoredValue(source: StorageSource, key: string): void {
  try {
    source().removeItem(key);
  } catch {
    // Blocked storage is treated as an unavailable session by the reader.
  }
}

function clearLegacySessions(): void {
  removeStoredValue(() => localStorage, LEGACY_SESSION_KEY);
  removeStoredValue(() => sessionStorage, LEGACY_SESSION_KEY);
  removeStoredValue(() => sessionStorage, FIRST_SESSION_KEY);
}

function signalChange(): void {
  try {
    // The shared cookie holds the session; this value only notifies other tabs.
    localStorage.setItem(SESSION_SIGNAL_KEY, crypto.randomUUID());
  } catch {
    // Focus/visibility checks still read the shared cookie when localStorage is blocked.
  }

  publish();
}

function migrateLegacySession(): void {
  if (typeof document === 'undefined') {
    return;
  }

  try {
    if (readSession() || localStorage.getItem(SESSION_SIGNAL_KEY)) {
      clearLegacySessions();
      return;
    }

    const persistent = parseSession(localStorage.getItem(LEGACY_SESSION_KEY));
    const temporary = parseSession(sessionStorage.getItem(LEGACY_SESSION_KEY));
    const first = sessionStorage.getItem(FIRST_SESSION_KEY);
    const firstUser = sessionUserSchema.safeParse(first ? JSON.parse(first) : null);
    const session = persistent?.expiresAt
      ? persistent
      : (temporary ??
        (firstUser.success ? { user: firstUser.data, expiresAt: null } : null));

    if (session) {
      writeSessionCookie(session);
      clearLegacySessions();
      signalChange();
    }
  } catch {
    // Invalid or unavailable legacy storage must not prevent a fresh sign-in.
  }
}

function scheduleExpiry(): void {
  clearTimeout(expiryTimer);
  expiryTimer = undefined;
  const expiresAt = readSession()?.expiresAt;

  if (listeners.size && expiresAt) {
    // Browser timers cannot represent the entire 30-day lifetime in one interval.
    expiryTimer = setTimeout(publish, Math.min(expiresAt - Date.now(), maxTimerDelay));
  }
}

function publish(): void {
  scheduleExpiry();
  listeners.forEach((listener) => listener());
}

function onStorage(event: StorageEvent): void {
  if (
    event.storageArea !== localStorage ||
    (event.key !== SESSION_SIGNAL_KEY && event.key !== null)
  ) {
    return;
  }

  clearLegacySessions();
  publish();
}

function onVisibilityChange(): void {
  if (document.visibilityState === 'visible') {
    publish();
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  if (listeners.size === 1) {
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', publish);
    document.addEventListener('visibilitychange', onVisibilityChange);
    scheduleExpiry();
  }

  return () => {
    listeners.delete(listener);

    if (!listeners.size) {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', publish);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      clearTimeout(expiryTimer);
      expiryTimer = undefined;
    }
  };
}

function save(user: SessionUser, rememberMe: boolean): void {
  const session: StoredSession = {
    user: sessionUserSchema.parse(user),
    expiresAt: rememberMe
      ? Date.now() + REMEMBER_SESSION_DAYS * 24 * 60 * 60 * 1000
      : null,
  };
  writeSessionCookie(session);
  clearLegacySessions();
  signalChange();
}

function clear(): void {
  document.cookie = `${SESSION_COOKIE}=; ${cookieAttributes()}; Max-Age=0`;
  clearLegacySessions();
  signalChange();
}

migrateLegacySession();

export const sessionStore = { getSnapshot, subscribe, save, clear };
