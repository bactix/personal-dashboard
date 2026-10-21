"use client"

import { StatList } from "@/components/dashboard/stat-list"
import { WidgetCard } from "@/components/dashboard/widget-card"
import { useToday } from "@/hooks/use-today"

import { useTasks } from "../hooks"

export function TasksStatsWidget() {
  const query = useTasks()
  const today = useToday()
  const tasks = query.data ?? []

  const overdue = today ? tasks.filter((task) => task.endDate && task.endDate < today).length : null
  const dueToday = today ? tasks.filter((task) => task.endDate === today).length : null

  return (
    <WidgetCard
      title="Tasks"
      description="Statistics"
      query={query}
      isEmpty={tasks.length === 0}
      emptyMessage="No tasks yet."
    >
      <StatList
        items={[
          { label: "Total tasks", value: String(tasks.length) },
          { label: "Overdue", value: overdue === null ? "…" : String(overdue) },
          { label: "Due today", value: dueToday === null ? "…" : String(dueToday) },
          { label: "No end date", value: String(tasks.filter((task) => !task.endDate).length) },
          { label: "In a project", value: String(tasks.filter((task) => task.projectId).length) },
        ]}
      />
    </WidgetCard>
  )
}
