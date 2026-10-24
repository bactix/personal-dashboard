"use client"

import { PlusIcon } from "lucide-react"
import { useState, type FormEvent } from "react"

import { EditTrigger } from "@/components/dashboard/edit-trigger"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useProjects } from "@/features/projects"
import { useToday } from "@/hooks/use-today"
import { userMessage } from "@/lib/http/errors"

import { useCreateTask, useUpdateTask } from "../hooks"
import {
  TASK_CATEGORIES,
  createTaskInputSchema,
  type Task,
  type TaskCategory,
} from "../types"

/** Select needs a non-empty value for the "no project" / "no category" choices. */
const NO_PROJECT = "none"
const NO_CATEGORY = "none"

/** Add form, or edit form when `task` is given. */
export function TaskDialog({ task }: { task?: Task }) {
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const pending = createTask.isPending || updateTask.isPending
  const projects = useProjects()

  const [open, setOpen] = useState(false)
  const [name, setName] = useState(task?.name ?? "")
  const [description, setDescription] = useState(task?.description ?? "")
  const today = useToday() ?? ""
  // null = untouched, so a new task's start follows "today" without reading the clock during render.
  const [pickedStart, setStartDate] = useState<string | null>(task?.startDate ?? null)
  const startDate = pickedStart ?? today
  const [endDate, setEndDate] = useState(task?.endDate ?? "")
  const [projectId, setProjectId] = useState(task?.projectId ?? NO_PROJECT)
  const [category, setCategory] = useState<string>(task?.category ?? NO_CATEGORY)
  const [error, setError] = useState<string | null>(null)
  const hasProject = projectId !== NO_PROJECT

  /** Fills the form from the task (edit) or clears it (add). Runs on open and close. */
  function load() {
    setName(task?.name ?? "")
    setDescription(task?.description ?? "")
    setStartDate(task?.startDate ?? null)
    setEndDate(task?.endDate ?? "")
    setProjectId(task?.projectId ?? NO_PROJECT)
    setCategory(task?.category ?? NO_CATEGORY)
    setError(null)
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = createTaskInputSchema.safeParse({
      name,
      description: description.trim() || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      projectId: hasProject ? projectId : undefined,
      // Categories are for tasks without a project.
      category: hasProject || category === NO_CATEGORY ? undefined : (category as TaskCategory),
    })
    if (!parsed.success) return setError(parsed.error.issues[0].message)

    setError(null)
    const handlers = {
      onSuccess: () => {
        setOpen(false)
        load()
      },
      onError: (caught: unknown) =>
        setError(userMessage(caught, "Could not save the task. Try again.")),
    }
    if (task) updateTask.mutate({ id: task.id, input: parsed.data }, handlers)
    else createTask.mutate(parsed.data, handlers)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        load()
      }}
    >
      <DialogTrigger asChild>
        {task ? (
          <EditTrigger itemLabel={`task “${task.name}”`} />
        ) : (
          <Button size="sm">
            <PlusIcon /> Add task
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{task ? "Edit task" : "Add task"}</DialogTitle>
            <DialogDescription>
              What needs doing? It starts today unless you pick another start date; the end date is
              optional.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="task-name">Task</Label>
            <Input
              id="task-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={150}
              placeholder="What needs to be done?"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="task-description">Description (optional)</Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={2000}
              rows={4}
              className="max-h-48 overflow-y-auto"
              placeholder="Details, notes, steps…"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="task-start">Start date</Label>
              <Input
                id="task-start"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="task-end">End date (optional)</Label>
              <Input
                id="task-end"
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Project (optional)</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="w-full" aria-label="Project">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_PROJECT}>No project</SelectItem>
                {projects.data?.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {!hasProject && (
            <div className="flex flex-col gap-2">
              <Label>Category (optional)</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full" aria-label="Category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CATEGORY}>No category</SelectItem>
                  {TASK_CATEGORIES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : task ? "Save changes" : "Save task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
