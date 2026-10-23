import { useMemo, useSyncExternalStore } from "react";

import { useToday } from "@/hooks/use-today";

import type { AzkarPeriod } from "./types";

// Reading progress is a per-device, per-day convenience: it lives in localStorage and
// starts from zero again each day, so it needs no server route.

const STORAGE_KEY = "azkar-progress";

type Stored = { date: string; counts: Record<string, number> };

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function readRaw(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function parse(raw: string): Stored | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (
      value &&
      typeof value === "object" &&
      "date" in value &&
      typeof value.date === "string" &&
      "counts" in value &&
      value.counts &&
      typeof value.counts === "object"
    ) {
      return value as Stored;
    }
  } catch {
    // fall through: unreadable data is treated as no progress
  }
  return null;
}

function write(next: Stored) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    return;
  }
  listeners.forEach((listener) => listener());
}

/** Whether anything is counted today (either period), and a reset for both periods at once. */
export function useAzkarOverview() {
  const raw = useSyncExternalStore(subscribe, readRaw, () => "");
  const today = useToday();
  const stored = useMemo(() => parse(raw), [raw]);

  const hasProgress =
    !!stored && stored.date === today && Object.values(stored.counts).some((count) => count > 0);

  return {
    hasProgress,
    resetAll() {
      if (!today) return;
      write({ date: today, counts: {} });
    },
  };
}

/** Today's tap counts for one period (morning / evening), with increment and reset. */
export function useAzkarProgress(period: AzkarPeriod) {
  const raw = useSyncExternalStore(subscribe, readRaw, () => "");
  const today = useToday();

  const stored = useMemo(() => parse(raw), [raw]);
  const counts = useMemo(
    () => (stored && stored.date === today ? stored.counts : {}),
    [stored, today]
  );

  const keyOf = (id: string) => `${period}:${id}`;

  /** Latest counts straight from storage, so rapid taps never act on a stale render. */
  function latestCounts(): Record<string, number> {
    const current = parse(readRaw());
    return current && current.date === today ? current.counts : {};
  }

  return {
    countOf: (id: string) => counts[keyOf(id)] ?? 0,
    increment(id: string, max: number) {
      if (!today) return;
      const base = latestCounts();
      const next = Math.min(max, (base[keyOf(id)] ?? 0) + 1);
      write({ date: today, counts: { ...base, [keyOf(id)]: next } });
    },
    reset(id?: string) {
      if (!today) return;
      const base = { ...latestCounts() };
      for (const key of Object.keys(base)) {
        if (id === undefined ? key.startsWith(`${period}:`) : key === keyOf(id)) delete base[key];
      }
      write({ date: today, counts: base });
    },
  };
}
