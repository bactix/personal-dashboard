// Server-only: a small brute-force limiter for the login route (Supabase checks the password).

const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

const failures = new Map<string, { count: number; resetAt: number }>();

export function isRateLimited(clientKey: string): boolean {
  const entry = failures.get(clientKey);
  if (!entry) return false;
  if (entry.resetAt <= Date.now()) {
    failures.delete(clientKey);
    return false;
  }
  return entry.count >= MAX_FAILED_ATTEMPTS;
}

export function recordFailure(clientKey: string): void {
  const entry = failures.get(clientKey);
  if (!entry || entry.resetAt <= Date.now()) {
    failures.set(clientKey, { count: 1, resetAt: Date.now() + WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

export function clearFailures(clientKey: string): void {
  failures.delete(clientKey);
}
