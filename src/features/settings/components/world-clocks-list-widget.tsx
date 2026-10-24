"use client"

import Link from "next/link"

import { ScrollList } from "@/components/dashboard/scroll-list"
import { WidgetCard } from "@/components/dashboard/widget-card"
import { useNow } from "@/hooks/use-now"

import { formatZoneTime } from "../clock"
import { useTimezones } from "../hooks"

/** Every registered city with its local time (the Home tile shows just one, picked by you). */
export function WorldClocksListWidget() {
  const query = useTimezones()
  const now = useNow()
  const items = query.data ?? []

  return (
    <WidgetCard
      title="World clocks"
      description={query.data ? `${items.length} registered` : "Local time in your cities"}
      query={query}
      isEmpty={items.length === 0}
      emptyMessage="No cities yet. Add one in Settings."
    >
      <div className="flex flex-col gap-3">
        <ScrollList label="World clocks">
          {items.map((item) => {
            const local = now === null ? null : formatZoneTime(now, item.timeZone)
            return (
              <li key={item.id} className="flex items-center justify-between gap-2 py-2">
                <span className="truncate font-medium">{item.city}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {local ? `${local.day} ${local.time}` : ""}
                </span>
              </li>
            )
          })}
        </ScrollList>
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
