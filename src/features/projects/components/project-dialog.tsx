"use client"

import { PlusIcon, XIcon } from "lucide-react"
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
import { createProjectInputSchema, MAX_RESOURCES, type Project, type Resource } from "../types"

type ResourceRow = { title: string; url: string }

/** Rows shown in the links editor; always at least one (empty rows are dropped on save). */
function rowsFrom(resources: Resource[] | undefined): ResourceRow[] {
  const rows = (resources ?? []).map((item) => ({ title: item.title ?? "", url: item.url }))
  return rows.length > 0 ? rows : [{ title: "", url: "" }]
}

/** "example.com" -> "https://example.com"; anything already with a scheme is left alone. */
function withScheme(value: string): string {
  const trimmed = value.trim()
  return /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`
}

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
  const [resources, setResources] = useState<ResourceRow[]>(rowsFrom(project?.resources))
  const [error, setError] = useState<string | null>(null)

  /** Fills the form from the project (edit) or clears it (add). Runs on open and close. */
  function load() {
    setName(project?.name ?? "")
    setStartDate(project?.startDate ?? null)
    setEndDate(project?.endDate ?? "")
    setResources(rowsFrom(project?.resources))
    setError(null)
  }

  function updateRow(index: number, patch: Partial<ResourceRow>) {
    setResources((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  function removeRow(index: number) {
    setResources((rows) => {
      const next = rows.filter((_, i) => i !== index)
      return next.length > 0 ? next : [{ title: "", url: "" }]
    })
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = createProjectInputSchema.safeParse({
      name,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      resources: resources
        .filter((row) => row.url.trim() !== "")
        .map((row) => ({ title: row.title.trim() || undefined, url: withScheme(row.url) })),
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
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
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

          <div className="flex flex-col gap-2">
            <Label htmlFor="project-resource-0">Resources (links)</Label>
            {resources.map((row, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  className="w-2/5"
                  aria-label={`Link ${index + 1} title`}
                  value={row.title}
                  onChange={(event) => updateRow(index, { title: event.target.value })}
                  maxLength={80}
                  placeholder="Title (optional)"
                />
                <Input
                  id={`project-resource-${index}`}
                  className="flex-1"
                  aria-label={`Link ${index + 1} address`}
                  inputMode="url"
                  autoComplete="off"
                  value={row.url}
                  onChange={(event) => updateRow(index, { url: event.target.value })}
                  maxLength={500}
                  placeholder="https://…"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove link ${index + 1}`}
                  disabled={resources.length === 1 && !row.title && !row.url}
                  onClick={() => removeRow(index)}
                >
                  <XIcon />
                </Button>
              </div>
            ))}
            {resources.length < MAX_RESOURCES && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-fit"
                onClick={() => setResources((rows) => [...rows, { title: "", url: "" }])}
              >
                <PlusIcon /> Add link
              </Button>
            )}
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
