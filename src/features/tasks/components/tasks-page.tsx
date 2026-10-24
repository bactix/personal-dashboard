"use client"

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

import { useProjects } from "@/features/projects"
import { usePagination } from "@/hooks/use-pagination"
import { formatCreatedDate } from "@/lib/dates"

import { useDeleteTask, useTasks } from "../hooks"
import { taskCategoryLabel, type Task } from "../types"
import { TaskDialog } from "./task-dialog"

/** Local calendar date as yyyy-mm-dd. */
const toLocalDate = (date: Date) => date.toLocaleDateString("en-CA")

function endStatus(task: Task) {
  if (!task.endDate) return { label: "No end date", variant: "secondary" as const }
  const now = toLocalDate(new Date())
  if (task.endDate < now) return { label: "Overdue", variant: "destructive" as const }
  if (task.endDate === now) return { label: "Due today", variant: "default" as const }
  return { label: "Upcoming", variant: "outline" as const }
}

export function TasksPage() {
  const query = useTasks()
  const deleteTask = useDeleteTask()
  const projects = useProjects()

  const tasks = query.data ?? []
  const pagination = usePagination(tasks)
  const projectNameById = new Map(projects.data?.map((project) => [project.id, project.name]))

  return (
    <div className="px-4 lg:px-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <WidgetCard
          title="Tasks"
          description={query.data ? `${tasks.length} total` : undefined}
          query={query}
          action={<TaskDialog />}
          isEmpty={tasks.length === 0}
          emptyMessage="No tasks yet. Use Add task to create one."
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Project / category</TableHead>
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
              {pagination.pageItems.map((task) => {
                const status = endStatus(task)
                return (
                  <TableRow key={task.id}>
                    <TableCell className="whitespace-normal">
                      <span className="font-medium wrap-break-word">{task.name}</span>
                      {task.description && (
                        <p className="mt-0.5 line-clamp-2 text-xs whitespace-pre-line text-muted-foreground">
                          {task.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-normal break-words text-muted-foreground">
                      {task.projectId ? (
                        (projectNameById.get(task.projectId) ?? "Unknown project")
                      ) : task.category ? (
                        <Badge variant="outline">{taskCategoryLabel(task.category)}</Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums">{task.startDate ?? "—"}</TableCell>
                    <TableCell className="tabular-nums">{task.endDate ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">{formatCreatedDate(task.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end">
                        <TaskDialog task={task} />
                        <DeleteButton
                          itemLabel={`task “${task.name}”`}
                          onDelete={() => deleteTask.mutateAsync(task.id)}
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
