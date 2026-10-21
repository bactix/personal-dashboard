import { useSyncExternalStore } from "react"

export const LEBANON_TIME_ZONE = "Asia/Beirut"

/** Re-checks every minute, so the date rolls over at midnight in Lebanon without a reload. */
function subscribe(onChange: () => void) {
  const id = window.setInterval(onChange, 60_000)
  return () => window.clearInterval(id)
}

/** Today's calendar day in Lebanon (yyyy-mm-dd), independent of the device's timezone. */
const clientSnapshot = () => new Date().toLocaleDateString("en-CA", { timeZone: LEBANON_TIME_ZONE })

/**
 * Today's date in Lebanon (yyyy-mm-dd), or `null` while server-rendering / hydrating.
 * Like `useToday`, this keeps `new Date()` out of render. The snapshot is a string, so
 * components only re-render when the day actually changes.
 */
export function useLebanonToday(): string | null {
  return useSyncExternalStore(subscribe, clientSnapshot, () => null)
}
