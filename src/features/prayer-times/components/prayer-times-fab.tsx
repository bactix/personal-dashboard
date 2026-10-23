"use client"

import { MoonStarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

import { PrayerTimesWidget } from "./prayer-times-widget"

/** Floating button (bottom-right, on every page) that opens today's prayer times. */
export function PrayerTimesFab() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="icon-lg"
          aria-label="Prayer times"
          title="Prayer times"
          className="fixed right-4 bottom-4 z-40 rounded-full shadow-lg"
        >
          <MoonStarIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" align="end" className="w-72 max-w-[calc(100vw-2rem)]">
        <PrayerTimesWidget bare />
      </PopoverContent>
    </Popover>
  )
}
