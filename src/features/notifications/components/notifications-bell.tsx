"use client"

import { BellIcon, XIcon } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

import { useNotifications } from "../hooks"
import type { NotificationSeverity } from "../types"

const DOT: Record<NotificationSeverity, string> = {
  overdue: "bg-destructive",
  soon: "bg-amber-500",
  info: "bg-primary",
}

/** Header bell: a count of what needs attention, and the list in a popover. */
export function NotificationsBell() {
  const { items, dismiss, dismissAll } = useNotifications()
  const [open, setOpen] = useState(false)
  const urgent = items.filter((item) => item.severity === "overdue").length

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative"
          aria-label={items.length > 0 ? `Notifications, ${items.length} new` : "Notifications"}
          title="Notifications"
        >
          <BellIcon />
          {items.length > 0 && (
            <Badge
              variant={urgent > 0 ? "destructive" : "default"}
              className="absolute -top-1 -right-1 h-4 min-w-4 justify-center px-1 text-[10px] tabular-nums"
            >
              {items.length > 99 ? "99+" : items.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 max-w-[calc(100vw-2rem)] p-0">
        <div className="flex items-center justify-between gap-2 border-b px-4 py-2">
          <p className="text-sm font-medium">Notifications</p>
          <Button variant="ghost" size="sm" disabled={items.length === 0} onClick={dismissAll}>
            Clear all
          </Button>
        </div>
        {items.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            You&apos;re all caught up.
          </p>
        ) : (
          <ul className="max-h-96 divide-y overflow-y-auto">
            {items.map((item) => (
              <li key={item.id} className="flex items-start gap-1 pr-1">
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex min-w-0 flex-1 gap-3 px-4 py-3 hover:bg-accent"
                >
                  <span
                    aria-hidden
                    className={cn("mt-1.5 size-2 shrink-0 rounded-full", DOT[item.severity])}
                  />
                  <span className="flex min-w-0 flex-col">
                    <span className="text-sm font-medium wrap-break-word">{item.title}</span>
                    <span className="text-xs text-muted-foreground wrap-break-word">{item.detail}</span>
                  </span>
                </Link>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="mt-2 text-muted-foreground"
                  aria-label={`Dismiss: ${item.title}`}
                  onClick={() => dismiss(item.id)}
                >
                  <XIcon />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}
