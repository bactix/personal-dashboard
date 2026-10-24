"use client"

import { CreatedDate } from "@/components/dashboard/created-date"
import { DeleteButton } from "@/components/dashboard/delete-button"
import { ListPagination } from "@/components/dashboard/list-pagination"
import { WidgetCard } from "@/components/dashboard/widget-card"
import { useNow } from "@/hooks/use-now"
import { usePagination } from "@/hooks/use-pagination"

import { formatZoneTime } from "../clock"
import { useDeleteTimezone, useTimezones } from "../hooks"
import { TimezoneDialog } from "./timezone-dialog"

export function TimezonesCard() {
  const query = useTimezones()
  const deleteTimezone = useDeleteTimezone()
  const pagination = usePagination(query.data ?? [])
  const now = useNow()

  return (
    <WidgetCard
      title="Time zones"
      description="Cities whose local time shows in the Home clocks"
      query={query}
      action={<TimezoneDialog />}
      bare
      isEmpty={query.data?.length === 0}
      emptyMessage="No cities yet. Use Add city to create one."
    >
      <ul className="divide-y">
        {pagination.pageItems.map((item) => {
          const local = now === null ? null : formatZoneTime(now, item.timeZone)
          return (
            <li key={item.id} className="flex items-center justify-between gap-2 py-2 text-sm">
              <div className="flex min-w-0 flex-col">
                <span className="font-medium wrap-break-word">{item.city}</span>
                <span className="break-all text-muted-foreground">{item.timeZone}</span>
                <CreatedDate iso={item.createdAt} />
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="tabular-nums text-muted-foreground">
                  {local ? `${local.day} ${local.time}` : ""}
                </span>
                <TimezoneDialog timezone={item} />
                <DeleteButton
                  itemLabel={`time zone “${item.city}”`}
                  onDelete={() => deleteTimezone.mutateAsync(item.id)}
                />
              </div>
            </li>
          )
        })}
      </ul>
      <ListPagination pagination={pagination} />
    </WidgetCard>
  )
}
