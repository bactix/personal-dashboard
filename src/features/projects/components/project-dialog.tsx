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
import { useToday } from "@/hooks/use-today"
import { userMessage } from "@/lib/http/errors"

import { useCreateProject, useUpdateProject } from "../hooks"
import { createProjectInputSchema, type Project } from "../types"

/** Add form, or edit form when `project` is given. */
export function ProjectDialog({ project }: { project?: Project }) {
  const createProject = useCreateProject()
  const updateProject = useUpdateProject()
  const pending = createProject.isPending || updateProject.isPending

  const [open, setOpen] = useState(false)
  const [name, setName] = useState(project?.name ?? "")
  const today = useToday() ?? ""
  // null = untouched, so a new project's start follows "today" without reading the clock during render.
  const [pickedStart, setStartDate] = useState<string | null>(project?.startDate ?? null)
  const startDate = pickedStart ?? today
  const [endDate, setEndDate] = useState(project?.endDate ?? "")
  const [error, setError] = useState<string | null>(null)

  /** Fills the form from the project (edit) or clears it (add). Runs on open and close. */
  function load() {
    setName(project?.name ?? "")
    setStartDate(project?.startDate ?? null)
    setEndDate(project?.endDate ?? "")
    setError(null)
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = createProjectInputSchema.safeParse({
      name,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    })
    if (!parsed.success) return setError(parsed.error.issues[0].message)

    setError(null)
    const handlers = {
      onSuccess: () => {
        setOpen(false)
        load()
      },
      onError: (caught: unknown) =>
        setError(userMessage(caught, "Could not save the project. Try again.")),
    }
    if (project) updateProject.mutate({ id: project.id, input: parsed.data }, handlers)
    else createProject.mutate(parsed.data, handlers)
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
        {project ? (
          <EditTrigger itemLabel={`project “${project.name}”`} />
        ) : (
          <Button size="sm">
            <PlusIcon /> Add project
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{project ? "Edit project" : "Add project"}</DialogTitle>
            <DialogDescription>
              Give the project a name. It starts today unless you pick another start date; the end
              date is optional.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="project-name">Project name</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={100}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="project-start">Start date</Label>
              <Input
                id="project-start"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="project-end">End date (optional)</Label>
              <Input
                id="project-end"
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : project ? "Save changes" : "Save project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
