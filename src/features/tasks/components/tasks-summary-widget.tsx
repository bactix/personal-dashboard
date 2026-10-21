"use client"

import Link from "next/link"

import { ScrollList } from "@/components/dashboard/scroll-list"
import { WidgetCard } from "@/components/dashboard/widget-card"
import { Badge } from "@/components/ui/badge"
import { useToday } from "@/hooks/use-today"

import { useTasks } from "../hooks"

export function TasksSummaryWidget() {
  const query = useTasks()
  const tasks = query.data ?? []
  // "" until mounted: no task data exists during server render, so nothing compares against it.
  const now = useToday() ?? ""

  const dueToday = tasks.filter((task) => task.endDate === now).length
  const overdue = tasks.filter((task) => task.endDate && task.endDate < now).length

  return (
    <WidgetCard
      title="Tasks"
      description={
        query.data ? `${dueToday} due today · ${overdue} overdue · ${tasks.length} total` : undefined
      }
      query={query}
      isEmpty={tasks.length === 0}
      emptyMessage="No tasks yet."
    >
      <div className="flex flex-col gap-3">
        <ScrollList label="Tasks, soonest end date first, undated last">
          {tasks.map((task) => (
            <li key={task.id} className="flex items-center justify-between gap-2 py-2">
              <span className="min-w-0 break-words">{task.name}</span>
              <Badge
                variant={
                  !task.endDate
                    ? "secondary"
                    : task.endDate < now
                      ? "destructive"
                      : task.endDate === now
                        ? "default"
                        : "outline"
                }
                className="shrink-0 tabular-nums"
              >
                {!task.endDate ? "No end date" : task.endDate === now ? "Today" : task.endDate}
              </Badge>
            </li>
          ))}
        </ScrollList>
        <Link
          href="/work/tasks"
          className="w-fit text-sm text-primary underline-offset-4 hover:underline"
        >
          View tasks
        </Link>
      </div>
    </WidgetCard>
  )
}
