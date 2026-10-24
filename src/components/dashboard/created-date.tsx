import { formatCreatedDate } from "@/lib/dates"

/** "Created 23-October-2026": the small line shown on every list row that isn't a table. */
export function CreatedDate({ iso }: { iso: string }) {
  return (
    <span className="block text-xs text-muted-foreground tabular-nums">
      Created {formatCreatedDate(iso)}
    </span>
  )
}
