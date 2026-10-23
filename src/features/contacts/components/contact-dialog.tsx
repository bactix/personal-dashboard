"use client"

import { PlusIcon, UserPlusIcon, XIcon } from "lucide-react"
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
import { createContactInputSchema, MAX_EMAILS, MAX_PHONES, type Contact } from "../types"

/** Rows shown in a list editor; always at least one (empty rows are dropped on save). */
function rowsFrom(values: string[] | undefined): string[] {
  return values && values.length > 0 ? values : [""]
}

type ValueListProps = {
  label: string
  addLabel: string
  idPrefix: string
  values: string[]
  onChange: (values: string[]) => void
  max: number
  invalid: boolean
  inputProps: React.ComponentProps<typeof Input>
}

/** A labelled list of inputs with add / remove controls. */
function ValueList({ label, addLabel, idPrefix, values, onChange, max, invalid, inputProps }: ValueListProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={`${idPrefix}-0`}>{label}</Label>
      {values.map((value, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            {...inputProps}
            id={`${idPrefix}-${index}`}
            value={value}
            onChange={(event) => onChange(values.map((v, i) => (i === index ? event.target.value : v)))}
            aria-invalid={invalid}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Remove ${label.toLowerCase()} ${index + 1}`}
            disabled={values.length === 1 && value === ""}
            onClick={() => {
              const next = values.filter((_, i) => i !== index)
              onChange(next.length > 0 ? next : [""])
            }}
          >
            <XIcon />
          </Button>
        </div>
      ))}
      {values.length < max && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-fit"
          onClick={() => onChange([...values, ""])}
        >
          <PlusIcon /> {addLabel}
        </Button>
      )}
    </div>
  )
}

/** Add form, or edit form when `contact` is given. */
export function ContactDialog({ contact }: { contact?: Contact }) {
  const createContact = useCreateContact()
  const updateContact = useUpdateContact()
  const pending = createContact.isPending || updateContact.isPending

  const [open, setOpen] = useState(false)
  const [name, setName] = useState(contact?.name ?? "")
  const [phones, setPhones] = useState(rowsFrom(contact?.phones))
  const [emails, setEmails] = useState(rowsFrom(contact?.emails))
  const [error, setError] = useState<string | null>(null)

  /** Fills the form from the contact (edit) or clears it (add). Runs on open and close. */
  function load() {
    setName(contact?.name ?? "")
    setPhones(rowsFrom(contact?.phones))
    setEmails(rowsFrom(contact?.emails))
    setError(null)
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const clean = (values: string[]) => values.map((v) => v.trim()).filter(Boolean)
    const parsed = createContactInputSchema.safeParse({
      name,
      phones: clean(phones),
      emails: clean(emails),
    })
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
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{contact ? "Edit contact" : "Add contact"}</DialogTitle>
            <DialogDescription>
              {contact
                ? "Change this contact’s details."
                : "Save a name with phone numbers and emails you can link debts to."}
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

          <ValueList
            label="Phone numbers"
            addLabel="Add phone number"
            idPrefix="contact-phone"
            values={phones}
            onChange={setPhones}
            max={MAX_PHONES}
            invalid={!!error}
            inputProps={{
              type: "tel",
              inputMode: "tel",
              autoComplete: "off",
              maxLength: 25,
              placeholder: "+961 70 123 456",
            }}
          />

          <ValueList
            label="Emails"
            addLabel="Add email"
            idPrefix="contact-email"
            values={emails}
            onChange={setEmails}
            max={MAX_EMAILS}
            invalid={!!error}
            inputProps={{
              type: "email",
              inputMode: "email",
              autoComplete: "off",
              maxLength: 120,
              placeholder: "name@example.com",
            }}
          />

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
