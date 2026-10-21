import type { ReactNode } from "react"

/** Rows visible before a home-screen list starts scrolling. */
export const SCROLL_LIST_VISIBLE_ROWS = 5

/** One row: py-2 (1rem) + a 1.25rem badge. Rows must stay this tall (single line). */
const ROW_HEIGHT_REM = 2.25

/**
 * List for dashboard tiles: shows SCROLL_LIST_VISIBLE_ROWS rows, then scrolls inside
 * itself instead of stretching the page. Children are the `<li>` rows.
 */
export function ScrollList({ label, children }: { label: string; children: ReactNode }) {
  const rows = SCROLL_LIST_VISIBLE_ROWS
  return (
    <ul
      className="flex flex-col divide-y overflow-y-auto pr-1 text-sm"
      style={{ maxHeight: `calc(${rows} * ${ROW_HEIGHT_REM}rem + ${rows - 1}px)` }}
      tabIndex={0}
      aria-label={label}
    >
      {children}
    </ul>
  )
}
