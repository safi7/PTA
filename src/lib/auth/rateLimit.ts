interface Entry {
  count: number;
  lastAttempt: number;
  lockedUntil?: number;
}

const store = new Map<string, Entry>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 30 * 60 * 1000;

export function checkRateLimit(key: string): { allowed: boolean; remainingMs?: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (entry?.lockedUntil && now < entry.lockedUntil) {
    return { allowed: false, remainingMs: entry.lockedUntil - now };
  }

  if (!entry || now - entry.lastAttempt > WINDOW_MS) {
    store.set(key, { count: 1, lastAttempt: now });
    return { allowed: true };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    const lockedUntil = now + LOCKOUT_MS;
    store.set(key, { ...entry, lockedUntil });
    return { allowed: false, remainingMs: LOCKOUT_MS };
  }

  store.set(key, { ...entry, count: entry.count + 1, lastAttempt: now });
  return { allowed: true };
}

export function resetRateLimit(key: string): void {
  store.delete(key);
}
