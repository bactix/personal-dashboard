"use client"

import { StatList } from "@/components/dashboard/stat-list"
import { WidgetCard } from "@/components/dashboard/widget-card"
import { useToday } from "@/hooks/use-today"

import { useProjects } from "../hooks"
import { statusOf, type ProjectStatus } from "../status"

export function ProjectsStatsWidget() {
  const query = useProjects()
  const today = useToday()
  const projects = query.data ?? []

  const countOf = (label: ProjectStatus["label"]) =>
    today ? String(projects.filter((project) => statusOf(project, today).label === label).length) : "…"

  return (
    <WidgetCard
      title="Projects"
      description="Statistics"
      query={query}
      isEmpty={projects.length === 0}
      emptyMessage="No projects yet."
    >
      <StatList
        items={[
          { label: "Total projects", value: String(projects.length) },
          { label: "In progress", value: countOf("In progress") },
          { label: "Upcoming", value: countOf("Upcoming") },
          { label: "Finished", value: countOf("Finished") },
          { label: "No dates", value: countOf("No dates") },
        ]}
      />
    </WidgetCard>
  )
}
