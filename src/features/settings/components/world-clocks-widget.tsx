"use client"

import Link from "next/link"

import { WidgetCard } from "@/components/dashboard/widget-card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useNow } from "@/hooks/use-now"

import { formatZoneDate, formatZoneTime } from "../clock"
import { useTimezones } from "../hooks"
import { useSelectedClockId } from "../selected-clock"

/** One clock showing the city picked from the saved time zones. */
export function WorldClocksWidget() {
  const query = useTimezones()
  const now = useNow()
  const [selectedId, selectId] = useSelectedClockId()
  const items = query.data ?? []
  // Falls back to the first city when nothing is chosen or the chosen one was deleted.
  const current = items.find((item) => item.id === selectedId) ?? items[0]

  return (
    <WidgetCard
      title="World clock"
      description="Local time in a city you saved"
      query={query}
      isEmpty={items.length === 0}
      emptyMessage="No cities yet. Add one in Settings."
    >
      {current && (
        <div className="flex flex-col gap-3">
          <Select value={current.id} onValueChange={selectId}>
            <SelectTrigger className="w-full" aria-label="City">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {items.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex flex-col">
            <p className="text-4xl font-semibold tabular-nums">
              {now === null ? "--:--" : formatZoneTime(now, current.timeZone).time}
            </p>
            <p className="text-sm text-muted-foreground">
              {now === null ? "" : formatZoneDate(now, current.timeZone)}
            </p>
            <p className="text-xs break-all text-muted-foreground">{current.timeZone}</p>
          </div>

          <Link
            href="/settings"
            className="w-fit text-sm text-primary underline-offset-4 hover:underline"
          >
            Manage in Settings
          </Link>
        </div>
      )}
    </WidgetCard>
  )
}
