import { useSyncExternalStore } from "react"

const subscribe = () => () => {}

/** Local calendar date as yyyy-mm-dd, computed in the browser only. */
const clientSnapshot = () => new Date().toLocaleDateString("en-CA")

/**
 * Today's date (yyyy-mm-dd), or `null` while server-rendering / hydrating.
 *
 * Reading `new Date()` directly in a client component's render makes Next.js flag the
 * page (the value would be frozen at prerender time), so components read it through
 * this hook instead and handle the `null` first render.
 */
export function useToday(): string | null {
  return useSyncExternalStore(subscribe, clientSnapshot, () => null)
}
