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

import { useCreateTicket, useUpdateTicket } from "../hooks"
import {
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  createTicketInputSchema,
  type Ticket,
  type TicketPriority,
  type TicketStatus,
} from "../types"

/** Add form, or edit form when `ticket` is given. */
export function TicketDialog({ ticket }: { ticket?: Ticket }) {
  const createTicket = useCreateTicket()
  const updateTicket = useUpdateTicket()
  const pending = createTicket.isPending || updateTicket.isPending

  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(ticket?.title ?? "")
  const [description, setDescription] = useState(ticket?.description ?? "")
  const [requester, setRequester] = useState(ticket?.requester ?? "")
  const [priority, setPriority] = useState<TicketPriority>(ticket?.priority ?? "medium")
  const [status, setStatus] = useState<TicketStatus>(ticket?.status ?? "open")
  const [error, setError] = useState<string | null>(null)

  /** Fills the form from the ticket (edit) or clears it (add). Runs on open and close. */
  function load() {
    setTitle(ticket?.title ?? "")
    setDescription(ticket?.description ?? "")
    setRequester(ticket?.requester ?? "")
    setPriority(ticket?.priority ?? "medium")
    setStatus(ticket?.status ?? "open")
    setError(null)
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = createTicketInputSchema.safeParse({
      title,
      description: description.trim() || undefined,
      requester: requester.trim() || undefined,
      priority,
      status,
    })
    if (!parsed.success) return setError(parsed.error.issues[0].message)

    setError(null)
    const handlers = {
      onSuccess: () => {
        setOpen(false)
        load()
      },
      onError: (caught: unknown) =>
        setError(userMessage(caught, "Could not save the ticket. Try again.")),
    }
    if (ticket) updateTicket.mutate({ id: ticket.id, input: parsed.data }, handlers)
    else createTicket.mutate(parsed.data, handlers)
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
        {ticket ? (
          <EditTrigger itemLabel={`ticket “${ticket.title}”`} />
        ) : (
          <Button size="sm">
            <PlusIcon /> Add ticket
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{ticket ? "Edit ticket" : "Add ticket"}</DialogTitle>
            <DialogDescription>A request for help that you need to track.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="ticket-title">Title</Label>
            <Input
              id="ticket-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
              placeholder="e.g. Printer not working"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="ticket-description">Description (optional)</Label>
            <Textarea
              id="ticket-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={1000}
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="ticket-requester">Requested by (optional)</Label>
            <Input
              id="ticket-requester"
              value={requester}
              onChange={(event) => setRequester(event.target.value)}
              maxLength={80}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(value) => setPriority(value as TicketPriority)}>
                <SelectTrigger className="w-full" aria-label="Priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TICKET_PRIORITIES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as TicketStatus)}>
                <SelectTrigger className="w-full" aria-label="Status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TICKET_STATUSES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : ticket ? "Save changes" : "Save ticket"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
