import { Children, type ReactNode } from "react"

import { cn } from "@/lib/utils"

/** Rows visible before a home-screen list starts scrolling. */
export const SCROLL_LIST_VISIBLE_ROWS = 5

/** One row: py-2 (1rem) + a 1.25rem badge. Rows must stay this tall (single line). */
const ROW_HEIGHT_REM = 2.25

const rowsHeight = (rows: number) => `calc(${rows} * ${ROW_HEIGHT_REM}rem + ${Math.max(rows - 1, 0)}px)`

/**
 * List for dashboard tiles: shows SCROLL_LIST_VISIBLE_ROWS rows, then scrolls inside
 * itself instead of stretching the page. Children are the `<li>` rows.
 *
 * With `fill` the list instead takes whatever height its card has to give (the card must
 * be a `<WidgetCard fill>` and the list's parent a flex column with `min-h-0 flex-1`): it
 * still counts as at most SCROLL_LIST_VISIBLE_ROWS rows tall for sizing the card, but grows
 * into spare room and only shows a scrollbar when the rows don't fit.
 */
export function ScrollList({ label, children, fill = false }: { label: string; children: ReactNode; fill?: boolean }) {
  const visibleRows = Math.min(Children.count(children), SCROLL_LIST_VISIBLE_ROWS)
  return (
    <ul
      className={cn("flex flex-col divide-y overflow-y-auto pr-1 text-sm", fill && "min-h-0 flex-1 basis-0")}
      style={fill ? { minHeight: rowsHeight(visibleRows) } : { maxHeight: rowsHeight(SCROLL_LIST_VISIBLE_ROWS) }}
      tabIndex={0}
      aria-label={label}
    >
      {children}
    </ul>
  )
}
