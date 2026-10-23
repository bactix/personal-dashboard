import { useSyncExternalStore } from "react";

// Which notifications the user has dismissed: a per-browser convenience kept in localStorage.

const KEY = "notifications-dismissed";
/** Oldest ids are dropped beyond this, so the list can't grow forever. */
const MAX_IDS = 500;

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
    return localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function parse(raw: string): string[] {
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids.slice(-MAX_IDS)));
  } catch {
    return;
  }
  listeners.forEach((listener) => listener());
}

/** Dismissed ids (as a raw string, so the snapshot is stable) plus dismiss helpers. */
export function useDismissed() {
  const raw = useSyncExternalStore(subscribe, readRaw, () => "[]");
  return {
    isDismissed: (id: string) => parse(raw).includes(id),
    dismiss(ids: string[]) {
      const current = parse(readRaw());
      write([...current, ...ids.filter((id) => !current.includes(id))]);
    },
  };
}
