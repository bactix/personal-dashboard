"use client"

import { useLebanonToday } from "@/hooks/use-lebanon-today"

const gregorian = new Intl.DateTimeFormat("en", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
})

// Calendar arithmetic only (no clock), so UTC keeps the day exactly as computed for Lebanon.
const hijri = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
})

/** Today's Gregorian and Hijri dates for Lebanon, stacked, for the header. */
export function LebanonDate() {
  const today = useLebanonToday()
  // Reserve the space while the date is unknown, so the header doesn't jump on hydration.
  if (!today) return <div className="h-7 w-28" aria-hidden />

  const noon = new Date(`${today}T12:00:00Z`)
  return (
    <div
      className="flex flex-col items-end text-[11px] leading-tight text-muted-foreground tabular-nums"
      title="Date in Lebanon"
    >
      <span>{gregorian.format(noon)}</span>
      <span>{hijri.format(noon)}</span>
    </div>
  )
}
