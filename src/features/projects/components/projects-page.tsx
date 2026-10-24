"use client"

import { LinkIcon } from "lucide-react"

import { DeleteButton } from "@/components/dashboard/delete-button"
import { ListPagination } from "@/components/dashboard/list-pagination"
import { WidgetCard } from "@/components/dashboard/widget-card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { usePagination } from "@/hooks/use-pagination"
import { useToday } from "@/hooks/use-today"
import { formatCreatedDate } from "@/lib/dates"

import { useDeleteProject, useProjects } from "../hooks"
import { statusOf } from "../status"
import { resourceLabel } from "../types"
import { ProjectDialog } from "./project-dialog"

export function ProjectsPage() {
  const query = useProjects()
  const deleteProject = useDeleteProject()
  const projects = query.data ?? []
  const pagination = usePagination(projects)
  // "" until mounted: no project rows exist during server render.
  const today = useToday() ?? ""

  return (
    <div className="px-4 lg:px-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <WidgetCard
          title="Projects"
          description={query.data ? `${projects.length} total` : undefined}
          query={query}
          action={<ProjectDialog />}
          isEmpty={projects.length === 0}
          emptyMessage="No projects yet. Use Add project to create one."
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-20">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.pageItems.map((project) => {
                const status = statusOf(project, today)
                return (
                  <TableRow key={project.id}>
                    <TableCell className="whitespace-normal">
                      <span className="font-medium wrap-break-word">{project.name}</span>
                      {project.resources.length > 0 && (
                        <ul aria-label={`Resources for ${project.name}`} className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                          {project.resources.map((resource, index) => (
                            <li key={`${resource.url}-${index}`}>
                              <a
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                              >
                                <LinkIcon className="size-3" /> {resourceLabel(resource)}
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums">{project.startDate ?? "—"}</TableCell>
                    <TableCell className="tabular-nums">{project.endDate ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">{formatCreatedDate(project.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end">
                        <ProjectDialog project={project} />
                        <DeleteButton
                          itemLabel={`project “${project.name}”`}
                          onDelete={() => deleteProject.mutateAsync(project.id)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <ListPagination pagination={pagination} />
        </WidgetCard>
      </div>
    </div>
  )
}
