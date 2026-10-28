import { z } from 'zod';
import { sessionUserSchema, type SessionUser } from '../types/auth';

export const REMEMBER_SESSION_DAYS = 30;

const SESSION_KEY = 'sprintboard.session.v2';
const LEGACY_SESSION_KEY = 'sprintboard.session.v1';
const SIGN_OUT_KEY = 'sprintboard.session.sign-out';
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

function readStoredSession(source: StorageSource): StoredSession | null {
  try {
    const value = source().getItem(SESSION_KEY);
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

function readSession(): StoredSession | null {
  const persistent = readStoredSession(() => localStorage);

  if (persistent?.expiresAt) {
    return persistent;
  }

  const temporary = readStoredSession(() => sessionStorage);

  if (temporary) {
    return temporary;
  }

  // Existing demo sessions retain their original, tab-only lifetime.
  try {
    const legacy = sessionStorage.getItem(LEGACY_SESSION_KEY);
    const result = sessionUserSchema.safeParse(legacy ? JSON.parse(legacy) : null);
    return result.success ? { user: result.data, expiresAt: null } : null;
  } catch {
    return null;
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

function clearTemporarySession(): void {
  removeStoredValue(() => sessionStorage, SESSION_KEY);
  removeStoredValue(() => sessionStorage, LEGACY_SESSION_KEY);
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
    (event.key !== SESSION_KEY && event.key !== SIGN_OUT_KEY && event.key !== null)
  ) {
    return;
  }

  // A shared login/logout supersedes any older session scoped to this tab.
  clearTemporarySession();
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
  const storage = rememberMe ? localStorage : sessionStorage;

  // Only demo identity and expiry are saved; credentials never enter either store.
  storage.setItem(SESSION_KEY, JSON.stringify(session));
  removeStoredValue(() => sessionStorage, LEGACY_SESSION_KEY);
  removeStoredValue(() => (rememberMe ? sessionStorage : localStorage), SESSION_KEY);
  publish();
}

function clear(): void {
  clearTemporarySession();
  removeStoredValue(() => localStorage, SESSION_KEY);

  try {
    // A new signal also signs out other tabs with non-persistent sessions.
    localStorage.setItem(SIGN_OUT_KEY, crypto.randomUUID());
  } catch {
    // Local sign-out still works when browser storage cannot accept new writes.
  }

  publish();
}

export const sessionStore = { getSnapshot, subscribe, save, clear };
