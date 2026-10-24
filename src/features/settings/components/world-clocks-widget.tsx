"use client"

import Link from "next/link"

import { WidgetCard } from "@/components/dashboard/widget-card"
import { useNow } from "@/hooks/use-now"

import { formatZoneDate, formatZoneTime } from "../clock"
import { useTimezones } from "../hooks"

/** Every saved city with its local time. */
export function WorldClocksWidget() {
  const query = useTimezones()
  const now = useNow()
  const items = query.data ?? []

  return (
    <WidgetCard
      title="World clocks"
      description={`${items.length} ${items.length === 1 ? "city" : "cities"} you saved`}
      query={query}
      isEmpty={items.length === 0}
      emptyMessage="No cities yet. Add one in Settings."
    >
      <div className="flex flex-col gap-3">
        <ul className="flex flex-col divide-y">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{item.city}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {now === null ? "" : formatZoneDate(now, item.timeZone)}
                </p>
              </div>
              <p className="shrink-0 text-2xl font-semibold tabular-nums">
                {now === null ? "--:--" : formatZoneTime(now, item.timeZone).time}
              </p>
            </li>
          ))}
        </ul>

        <Link
          href="/settings"
          className="w-fit text-sm text-primary underline-offset-4 hover:underline"
        >
          Manage in Settings
        </Link>
      </div>
    </WidgetCard>
  )
}
