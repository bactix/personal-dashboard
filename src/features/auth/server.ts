import { createHash, timingSafeEqual } from "node:crypto";

import { getAuthEnv } from "@/lib/env";

// Server-only: single-owner password check plus a small brute-force limiter.

const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

const failures = new Map<string, { count: number; resetAt: number }>();

const digest = (value: string) => createHash("sha256").update(value).digest();

/** Compares digests in constant time so response timing can't leak the password. */
export function verifyPassword(candidate: string): boolean {
  const { password } = getAuthEnv();
  return timingSafeEqual(digest(candidate), digest(password));
}

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
