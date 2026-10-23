import { useSyncExternalStore } from "react"

const TICK_MS = 15_000

let snapshot = 0
const listeners = new Set<() => void>()
let timer: ReturnType<typeof setInterval> | undefined

function subscribe(listener: () => void) {
  if (listeners.size === 0) {
    snapshot = Date.now()
    timer = setInterval(() => {
      snapshot = Date.now()
      listeners.forEach((notify) => notify())
    }, TICK_MS)
  }
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) clearInterval(timer)
  }
}

const clientSnapshot = () => snapshot || (snapshot = Date.now())

/** Current time in ms, refreshed every 15s, or `null` while server-rendering / hydrating. */
export function useNow(): number | null {
  return useSyncExternalStore(subscribe, clientSnapshot, () => null)
}
