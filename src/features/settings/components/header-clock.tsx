"use client"

import { ChevronDownIcon, ClockIcon } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useNow } from "@/hooks/use-now"

import { formatZoneTime } from "../clock"
import { useTimezones } from "../hooks"
import { useSelectedClockId } from "../selected-clock"

/** Header clock: shows the time in the chosen city; the menu switches between saved cities. */
export function HeaderClock() {
  const query = useTimezones()
  const now = useNow()
  const [selectedId, selectId] = useSelectedClockId()
  const items = query.data ?? []
  // Falls back to the first city when nothing is chosen or the chosen one was deleted.
  const current = items.find((item) => item.id === selectedId) ?? items[0]

  if (!current) {
    // Nothing saved yet (or still loading): link to where cities are added.
    return (
      <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
        <Link href="/settings" aria-label="Add a city clock in Settings" title="Add a city clock">
          <ClockIcon />
          <span className="hidden sm:inline">Add clock</span>
        </Link>
      </Button>
    )
  }

  const time = now === null ? "--:--" : formatZoneTime(now, current.timeZone).time

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={`Clock: ${current.city}. Change city`}>
          <ClockIcon />
          <span className="hidden max-w-24 truncate sm:inline">{current.city}</span>
          <span className="tabular-nums">{time}</span>
          <ChevronDownIcon className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuLabel>Show time in</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={current.id} onValueChange={selectId}>
          {items.map((item) => (
            <DropdownMenuRadioItem key={item.id} value={item.id}>
              <span className="flex-1">{item.city}</span>
              <span className="ml-4 tabular-nums text-muted-foreground">
                {now === null ? "" : formatZoneTime(now, item.timeZone).time}
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
