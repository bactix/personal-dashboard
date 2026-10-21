import { useState } from "react"

export const DEFAULT_PAGE_SIZE = 10

export type Pagination<T> = {
  /** Current page, 1-based. Always valid for the current item count. */
  page: number
  pageCount: number
  total: number
  /** 1-based position of the first / last item on this page (0 / 0 when empty). */
  from: number
  to: number
  pageItems: T[]
  setPage: (page: number) => void
}

/**
 * Client-side pagination over a list that is already loaded.
 * The page is clamped, so deleting items or reloading never leaves you on an empty page.
 */
export function usePagination<T>(items: T[], pageSize = DEFAULT_PAGE_SIZE): Pagination<T> {
  const [requestedPage, setRequestedPage] = useState(1)

  const total = items.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, requestedPage), pageCount)
  const start = (page - 1) * pageSize

  return {
    page,
    pageCount,
    total,
    from: total === 0 ? 0 : start + 1,
    to: Math.min(start + pageSize, total),
    pageItems: items.slice(start, start + pageSize),
    setPage: (next) => setRequestedPage(Math.min(Math.max(1, next), pageCount)),
  }
}
