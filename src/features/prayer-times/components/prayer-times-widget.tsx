"use client"

import { WidgetCard } from "@/components/dashboard/widget-card"

import { usePrayerTimes } from "../hooks"

const dateFormat = new Intl.DateTimeFormat("en", {
  weekday: "long",
  day: "numeric",
  month: "long",
})

/** `bare` drops the card frame and title, for use inside another container (e.g. a popover). */
export function PrayerTimesWidget({ bare = false }: { bare?: boolean }) {
  const query = usePrayerTimes()
  const data = query.data

  // Parse as local noon so timezone shifts can't change the day.
  const dateLabel = data ? dateFormat.format(new Date(`${data.date}T12:00:00`)) : undefined

  return (
    <WidgetCard
      title="Prayer times"
      description={data ? `${data.location} · ${dateLabel}` : "Lebanon"}
      query={query}
      bare={bare}
    >
      {data && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{data.hijriDate}</p>
          <ul className="divide-y">
            {data.prayers.map((prayer) => (
              <li key={prayer.key} className="flex items-center justify-between py-2 text-sm">
                <span className="font-medium">{prayer.label}</span>
                <span className="tabular-nums">{prayer.time}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </WidgetCard>
  )
}
