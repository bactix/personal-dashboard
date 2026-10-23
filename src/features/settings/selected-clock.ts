import { useSyncExternalStore } from "react"

const KEY = "world-clock-city"
const listeners = new Set<() => void>()

function read(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  window.addEventListener("storage", listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", listener)
  }
}

/** Id of the city the Home clock shows (a per-browser preference), or null if none chosen yet. */
export function useSelectedClockId(): [string | null, (id: string) => void] {
  const id = useSyncExternalStore(subscribe, read, () => null)
  const set = (next: string) => {
    try {
      localStorage.setItem(KEY, next)
    } catch {
      // Storage unavailable: the choice just won't persist.
    }
    listeners.forEach((notify) => notify())
  }
  return [id, set]
}
