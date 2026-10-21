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
import { userMessage } from "@/lib/http/errors"

import { useCreatePurchaseItem, useUpdatePurchaseItem } from "../hooks"
import { createPurchaseItemInputSchema, type PurchaseItem } from "../types"

/** Add form, or edit form when `item` is given. */
export function PurchaseItemDialog({ item }: { item?: PurchaseItem }) {
  const createItem = useCreatePurchaseItem()
  const updateItem = useUpdatePurchaseItem()
  const pending = createItem.isPending || updateItem.isPending

  const [open, setOpen] = useState(false)
  const [name, setName] = useState(item?.name ?? "")
  const [url, setUrl] = useState(item?.url ?? "")
  const [note, setNote] = useState(item?.note ?? "")
  const [error, setError] = useState<string | null>(null)

  /** Fills the form from the item (edit) or clears it (add). Runs on open and close. */
  function load() {
    setName(item?.name ?? "")
    setUrl(item?.url ?? "")
    setNote(item?.note ?? "")
    setError(null)
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = createPurchaseItemInputSchema.safeParse({
      name,
      url: url.trim() || undefined,
      note: note.trim() || undefined,
    })
    if (!parsed.success) return setError(parsed.error.issues[0].message)

    setError(null)
    const handlers = {
      onSuccess: () => {
        setOpen(false)
        load()
      },
      onError: (caught: unknown) =>
        setError(userMessage(caught, "Could not save the item. Try again.")),
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
          <EditTrigger itemLabel={`item “${item.name}”`} />
        ) : (
          <Button size="sm">
            <PlusIcon /> Add item
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{item ? "Edit item" : "Add item"}</DialogTitle>
            <DialogDescription>
              {item ? "Change this item on your to-buy list." : "Add something to your to-buy list."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="item-name">What do you want to buy?</Label>
            <Input
              id="item-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={100}
              placeholder="e.g. Mechanical keyboard"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="item-url">Link (optional)</Label>
            <Input
              id="item-url"
              type="url"
              inputMode="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://…"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="item-note">Note (optional)</Label>
            <Input
              id="item-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={200}
              placeholder="Size, colour, price…"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : item ? "Save changes" : "Save item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
