"use client"

import Link from "next/link"

import { ScrollList } from "@/components/dashboard/scroll-list"
import { WidgetCard } from "@/components/dashboard/widget-card"
import { Badge } from "@/components/ui/badge"
import { useToday } from "@/hooks/use-today"

import { useProjects } from "../hooks"
import { statusOf } from "../status"

export function ProjectsSummaryWidget() {
  const query = useProjects()
  const projects = query.data ?? []
  // "" until mounted: no project data exists during server render, so nothing compares against it.
  const today = useToday() ?? ""
  const active = projects.filter((project) => statusOf(project, today).label === "In progress").length

  return (
    <WidgetCard
      title="Projects"
      description={query.data ? `${active} in progress · ${projects.length} total` : undefined}
      query={query}
      isEmpty={projects.length === 0}
      emptyMessage="No projects yet."
    >
      <div className="flex flex-col gap-3">
        <ScrollList label="Projects, newest start date first">
          {projects.map((project) => {
            const status = statusOf(project, today)
            return (
              <li key={project.id} className="flex items-center justify-between gap-2 py-2">
                <span className="min-w-0 break-words">{project.name}</span>
                <Badge variant={status.variant} className="shrink-0">
                  {status.label}
                </Badge>
              </li>
            )
          })}
        </ScrollList>
        <Link
          href="/work/projects"
          className="w-fit text-sm text-primary underline-offset-4 hover:underline"
        >
          View projects
        </Link>
      </div>
    </WidgetCard>
  )
}
