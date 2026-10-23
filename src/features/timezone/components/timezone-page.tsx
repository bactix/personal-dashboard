"use client"

import Link from "next/link"
import { useState } from "react"

import { ListPagination } from "@/components/dashboard/list-pagination"
import { WidgetCard } from "@/components/dashboard/widget-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useNow } from "@/hooks/use-now"
import { usePagination } from "@/hooks/use-pagination"
import { useTimezones } from "@/features/settings"

import {
  compareInstant,
  fromLocalInputValue,
  LEBANON_ZONE,
  toLocalInputValue,
} from "../convert"

/** Enter a date and time in Lebanon; see the matching date and time in every saved city. */
export function TimezonePage() {
  const query = useTimezones()
  const now = useNow()
  // null = follow the current Lebanon time; set once the user edits the field.
  const [typed, setTyped] = useState<string | null>(null)

  const value = typed ?? (now === null ? "" : toLocalInputValue(now, LEBANON_ZONE))
  const instant = value ? fromLocalInputValue(value, LEBANON_ZONE) : null

  const cities = query.data ?? []
  const pagination = usePagination(cities)

  return (
    <div className="px-4 lg:px-6">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <div className="flex flex-col gap-2 rounded-xl border p-4">
          <Label htmlFor="lebanon-datetime">Date and time in Lebanon</Label>
          <div className="flex items-center gap-2">
            <Input
              id="lebanon-datetime"
              type="datetime-local"
              value={value}
              onChange={(event) => setTyped(event.target.value || null)}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={typed === null}
              onClick={() => setTyped(null)}
            >
              Now
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Lebanon time ({LEBANON_ZONE}). Leave on “Now” to follow the current time.
          </p>
        </div>

        <WidgetCard
          title="Time in your cities"
          description={
            cities.length > 0 ? `${cities.length} saved` : "Cities come from Settings → Time zones"
          }
          query={query}
          isEmpty={cities.length === 0}
          emptyMessage="No cities yet. Add some in Settings → Time zones."
        >
          {instant === null ? (
            <p className="text-sm text-muted-foreground">Enter a valid date and time.</p>
          ) : (
            <>
              <ul className="divide-y">
                {pagination.pageItems.map((city) => {
                  const result = compareInstant(instant, city.timeZone)
                  return (
                    <li key={city.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <div className="flex min-w-0 flex-col">
                        <span className="font-medium wrap-break-word">{city.city}</span>
                        <span className="text-muted-foreground">
                          {result.difference} · {result.day}
                        </span>
                      </div>
                      <div className="flex shrink-0 flex-col items-end tabular-nums">
                        <span className="text-base font-semibold">{result.time}</span>
                        <span className="text-muted-foreground">{result.date}</span>
                      </div>
                    </li>
                  )
                })}
              </ul>
              <ListPagination pagination={pagination} />
            </>
          )}
          <Link
            href="/settings"
            className="mt-3 block w-fit text-sm text-primary underline-offset-4 hover:underline"
          >
            Manage cities in Settings
          </Link>
        </WidgetCard>
      </div>
    </div>
  )
}
