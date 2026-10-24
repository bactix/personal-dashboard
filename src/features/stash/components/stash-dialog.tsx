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
import { userMessage } from "@/lib/http/errors"

import { useCreateStashItem, useUpdateStashItem } from "../hooks"
import {
  createStashInputSchema,
  MAX_CONTENT_LENGTH,
  STASH_STATUSES,
  type StashItem,
  type StashStatus,
} from "../types"

/** Add form, or edit form when `item` is given. */
export function StashDialog({ item }: { item?: StashItem }) {
  const createItem = useCreateStashItem()
  const updateItem = useUpdateStashItem()
  const pending = createItem.isPending || updateItem.isPending

  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(item?.title ?? "")
  const [content, setContent] = useState(item?.content ?? "")
  const [status, setStatus] = useState<StashStatus>(item?.status ?? "pending")
  const [error, setError] = useState<string | null>(null)

  /** Fills the form from the item (edit) or clears it (add). Runs on open and close. */
  function load() {
    setTitle(item?.title ?? "")
    setContent(item?.content ?? "")
    setStatus(item?.status ?? "pending")
    setError(null)
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = createStashInputSchema.safeParse({ title, content, status })
    if (!parsed.success) return setError(parsed.error.issues[0].message)

    setError(null)
    const handlers = {
      onSuccess: () => {
        setOpen(false)
        load()
      },
      onError: (caught: unknown) => setError(userMessage(caught, "Could not save the item. Try again.")),
    }
    if (item) updateItem.mutate({ id: item.id, input: parsed.data }, handlers)
    else createItem.mutate(parsed.data, handlers)
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
        {item ? (
          <EditTrigger itemLabel={`stash item “${item.title}”`} />
        ) : (
          <Button size="sm">
            <PlusIcon /> Stash something
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{item ? "Edit stash item" : "Stash something"}</DialogTitle>
            <DialogDescription>Keep a link or some text for later.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="stash-title">Title</Label>
            <Input
              id="stash-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              aria-invalid={!!error}
              maxLength={120}
              autoComplete="off"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="stash-content">Link or text</Label>
            <Textarea
              id="stash-content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              aria-invalid={!!error}
              maxLength={MAX_CONTENT_LENGTH}
              rows={5}
              className="max-h-64 overflow-y-auto"
              placeholder="https://… or anything you want to remember"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as StashStatus)}>
              <SelectTrigger className="w-full" aria-label="Status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STASH_STATUSES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : item ? "Save changes" : "Stash it"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
