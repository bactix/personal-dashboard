"use client"

import { UserPlusIcon } from "lucide-react"
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

import { useCreateContact, useUpdateContact } from "../hooks"
import { createContactInputSchema, type Contact } from "../types"

/** Add form, or edit form when `contact` is given. */
export function ContactDialog({ contact }: { contact?: Contact }) {
  const createContact = useCreateContact()
  const updateContact = useUpdateContact()
  const pending = createContact.isPending || updateContact.isPending

  const [open, setOpen] = useState(false)
  const [name, setName] = useState(contact?.name ?? "")
  const [phone, setPhone] = useState(contact?.phone ?? "")
  const [error, setError] = useState<string | null>(null)

  /** Fills the form from the contact (edit) or clears it (add). Runs on open and close. */
  function load() {
    setName(contact?.name ?? "")
    setPhone(contact?.phone ?? "")
    setError(null)
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = createContactInputSchema.safeParse({ name, phone })
    if (!parsed.success) return setError(parsed.error.issues[0].message)

    setError(null)
    const handlers = {
      onSuccess: () => {
        setOpen(false)
        load()
      },
      onError: (caught: unknown) =>
        setError(userMessage(caught, "Could not save the contact. Try again.")),
    }
    if (contact) updateContact.mutate({ id: contact.id, input: parsed.data }, handlers)
    else createContact.mutate(parsed.data, handlers)
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
        {contact ? (
          <EditTrigger itemLabel={`contact “${contact.name}”`} />
        ) : (
          <Button size="sm">
            <UserPlusIcon /> Add contact
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{contact ? "Edit contact" : "Add contact"}</DialogTitle>
            <DialogDescription>
              {contact ? "Change this contact’s details." : "Save a name and phone number you can link debts to."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="contact-name">Name</Label>
            <Input
              id="contact-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={!!error}
              maxLength={80}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="contact-phone">Phone number</Label>
            <Input
              id="contact-phone"
              type="tel"
              inputMode="tel"
              autoComplete="off"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              aria-invalid={!!error}
              maxLength={25}
              placeholder="+961 70 123 456"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : contact ? "Save changes" : "Save contact"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
