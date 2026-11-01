import { useCallback, useMemo, useSyncExternalStore } from "react"

// A dashboard's widget order is a per-browser preference, so it lives in localStorage. Read through
// useSyncExternalStore: the server (and the hydrating first render) sees "no saved order", then the
// client switches to the saved one without a hydration mismatch.

const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  window.addEventListener("storage", listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", listener)
  }
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function parse(raw: string | null): string[] | null {
  if (!raw) return null
  try {
    const value: unknown = JSON.parse(raw)
    return Array.isArray(value) && value.every((item) => typeof item === "string") ? value : null
  } catch {
    return null
  }
}

/** The saved widget ids for a dashboard (or `null` for the default order) and a way to save a new order. */
export function useWidgetOrder(storageKey: string) {
  const key = `dashboard-order:${storageKey}`
  const raw = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null
  )
  const order = useMemo(() => parse(raw), [raw])

  const save = useCallback(
    (ids: string[]) => {
      try {
        localStorage.setItem(key, JSON.stringify(ids))
      } catch {
        // Storage unavailable (private window, blocked site data): the order just won't persist.
      }
      listeners.forEach((listener) => listener())
    },
    [key]
  )

  return [order, save] as const
}
