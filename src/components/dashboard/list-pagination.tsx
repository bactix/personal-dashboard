"use client"

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { Pagination } from "@/hooks/use-pagination"

/** "1–10 of 25" with Previous / Next. Renders nothing when everything fits on one page. */
export function ListPagination({ pagination }: { pagination: Pagination<unknown> }) {
  const { page, pageCount, from, to, total, setPage } = pagination
  if (pageCount <= 1) return null

  return (
    <nav
      aria-label="Pagination"
      className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm"
    >
      <p className="text-muted-foreground tabular-nums" aria-live="polite">
        {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
        >
          <ChevronLeftIcon /> Previous
        </Button>
        <span className="tabular-nums text-muted-foreground">
          {page} / {pageCount}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(page + 1)}
          disabled={page === pageCount}
          aria-label="Next page"
        >
          Next <ChevronRightIcon />
        </Button>
      </div>
    </nav>
  )
}
