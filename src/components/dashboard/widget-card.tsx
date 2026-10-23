"use client"

import { RefreshCwIcon } from "lucide-react"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { isApiError } from "@/lib/http/errors"

/** The subset of a TanStack Query result the card needs — any useQuery() result fits. */
export type WidgetQueryState = {
  isPending: boolean
  isError: boolean
  isFetching: boolean
  error: unknown
  refetch: () => unknown
}

type WidgetCardProps = {
  title: string
  description?: string
  query: WidgetQueryState
  /** Show the empty state instead of children (e.g. `data.items.length === 0`). */
  isEmpty?: boolean
  emptyMessage?: string
  /** Extra controls rendered at the top-right of the header. */
  action?: ReactNode
  /** Render without the card frame and title (the caller shows its own heading). */
  bare?: boolean
  /** Rendered only when the query has data. Write the happy path here. */
  children: ReactNode
}

/**
 * One query state for a widget that needs several queries (e.g. wallets + transactions).
 * Pending until all have data (an error shows as soon as any query fails); refetch reloads all.
 */
export function combineQueries(...queries: WidgetQueryState[]): WidgetQueryState {
  const failed = queries.find((query) => query.isError)
  return {
    isPending: !failed && queries.some((query) => query.isPending),
    isError: failed !== undefined,
    isFetching: queries.some((query) => query.isFetching),
    error: failed?.error,
    refetch: () => Promise.all(queries.map((query) => query.refetch())),
  }
}

function errorMessage(error: unknown): string {
  if (isApiError(error) && error.code === "invalid-response") {
    return "The service returned unexpected data."
  }
  if (isApiError(error) && error.code === "timeout") return "The request timed out."
  return "Couldn't load this data."
}

/**
 * Standard frame for every widget. Owns the loading, error, and empty states
 * so feature code only implements the happy path.
 */
export function WidgetCard({
  title,
  description,
  query,
  isEmpty = false,
  emptyMessage = "Nothing to show yet.",
  action,
  bare = false,
  children,
}: WidgetCardProps) {
  if (bare) {
    // No frame or title: the caller (e.g. a settings section band) supplies the heading.
    return (
      <div className="@container/card flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">{description}</p>
          <div className="flex items-center gap-1">
            {action}
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Refresh ${title}`}
              disabled={query.isFetching}
              onClick={() => query.refetch()}
            >
              <RefreshCwIcon className={query.isFetching ? "animate-spin" : undefined} />
            </Button>
          </div>
        </div>
        {query.isPending ? (
          <div className="flex flex-col gap-3" aria-busy="true">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : query.isError ? (
          <div role="alert" className="flex flex-col items-start gap-3 text-sm">
            <p className="text-muted-foreground">{errorMessage(query.error)}</p>
            <Button variant="outline" size="sm" onClick={() => query.refetch()}>
              Retry
            </Button>
          </div>
        ) : isEmpty ? (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          children
        )}
      </div>
    )
  }

  return (
    <Card className="@container/card h-full">
      <CardHeader>
        <CardDescription>{description}</CardDescription>
        <CardTitle>{title}</CardTitle>
        <CardAction className="flex items-center gap-1">
          {action}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Refresh ${title}`}
            disabled={query.isFetching}
            onClick={() => query.refetch()}
          >
            <RefreshCwIcon className={query.isFetching ? "animate-spin" : undefined} />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {query.isPending ? (
          <div className="flex flex-col gap-3" aria-busy="true">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : query.isError ? (
          <div role="alert" className="flex flex-col items-start gap-3 text-sm">
            <p className="text-muted-foreground">{errorMessage(query.error)}</p>
            <Button variant="outline" size="sm" onClick={() => query.refetch()}>
              Retry
            </Button>
          </div>
        ) : isEmpty ? (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}
