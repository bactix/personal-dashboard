"use client"

import { PlusIcon } from "lucide-react"
import Link from "next/link"
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
import { useContacts } from "@/features/contacts"
import { userMessage } from "@/lib/http/errors"
import { CURRENCIES, parseAmountToCents, type Currency } from "@/lib/money"

import { useCreateDebt, useUpdateDebt } from "../hooks"
import { createDebtInputSchema, type Debt, type DebtDirection } from "../types"

const DIRECTIONS: { value: DebtDirection; label: string; hint: string }[] = [
  { value: "i-owe", label: "I owe", hint: "A debt on me" },
  { value: "owed-to-me", label: "Owes me", hint: "A debt on the contact" },
]

/** Cents -> the text a person would type, e.g. 2550 -> "25.50". */
const toAmountText = (cents: number) => (cents / 100).toFixed(2)

/** Add form, or edit form when `debt` is given. */
export function DebtDialog({ debt }: { debt?: Debt }) {
  const contacts = useContacts()
  const createDebt = useCreateDebt()
  const updateDebt = useUpdateDebt()
  const pending = createDebt.isPending || updateDebt.isPending

  const [open, setOpen] = useState(false)
  const [direction, setDirection] = useState<DebtDirection>(debt?.direction ?? "i-owe")
  const [contactId, setContactId] = useState(debt?.contactId ?? "")
  const [amount, setAmount] = useState(debt ? toAmountText(debt.amountCents) : "")
  const [currency, setCurrency] = useState<Currency>(debt?.currency ?? "USD")
  const [description, setDescription] = useState(debt?.description ?? "")
  const [dueDate, setDueDate] = useState(debt?.dueDate ?? "")
  const [error, setError] = useState<string | null>(null)

  /** Fills the form from the debt (edit) or clears it (add). Runs on open and close. */
  function load() {
    setDirection(debt?.direction ?? "i-owe")
    setContactId(debt?.contactId ?? "")
    setAmount(debt ? toAmountText(debt.amountCents) : "")
    setCurrency(debt?.currency ?? "USD")
    setDescription(debt?.description ?? "")
    setDueDate(debt?.dueDate ?? "")
    setError(null)
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!contactId) return setError("Choose a contact.")
    const amountCents = parseAmountToCents(amount)
    if (amountCents === null) return setError("Enter a valid amount, e.g. 25 or 25.50.")

    const parsed = createDebtInputSchema.safeParse({
      direction,
      contactId,
      amountCents,
      currency,
      description: description.trim() || undefined,
      dueDate: dueDate || undefined,
    })
    if (!parsed.success) return setError(parsed.error.issues[0].message)

    setError(null)
    const handlers = {
      onSuccess: () => {
        setOpen(false)
        load()
      },
      onError: (caught: unknown) =>
        setError(userMessage(caught, "Could not save the debt. Try again.")),
    }
    if (debt) updateDebt.mutate({ id: debt.id, input: parsed.data }, handlers)
    else createDebt.mutate(parsed.data, handlers)
  }

  const noContacts = contacts.isSuccess && contacts.data.length === 0

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        load()
      }}
    >
      <DialogTrigger asChild>
        {debt ? (
          <EditTrigger itemLabel="debt" />
        ) : (
          <Button size="sm">
            <PlusIcon /> Add debt
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{debt ? "Edit debt" : "Add debt"}</DialogTitle>
            <DialogDescription>Record money you owe or that someone owes you.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Debt direction">
            {DIRECTIONS.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={direction === option.value ? "default" : "outline"}
                aria-pressed={direction === option.value}
                onClick={() => setDirection(option.value)}
                className="h-auto flex-col gap-0 py-2"
              >
                <span>{option.label}</span>
                <span className="text-xs font-normal opacity-80">{option.hint}</span>
              </Button>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Contact</Label>
            {noContacts ? (
              <p className="text-sm text-muted-foreground">
                No contacts yet.{" "}
                <Link href="/personal/contacts" className="underline underline-offset-4">
                  Add a contact first
                </Link>
                .
              </p>
            ) : (
              <Select value={contactId} onValueChange={setContactId}>
                <SelectTrigger className="w-full" aria-label="Contact">
                  <SelectValue placeholder="Select a contact" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.data?.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid grid-cols-[1fr_6rem] gap-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="debt-amount">Amount</Label>
              <Input
                id="debt-amount"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={(value) => setCurrency(value as Currency)}>
                <SelectTrigger className="w-full" aria-label="Currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((code) => (
                    <SelectItem key={code} value={code}>
                      {code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="debt-description">Note (optional)</Label>
            <Input
              id="debt-description"
              maxLength={200}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="debt-due">Due date (optional)</Label>
            <Input
              id="debt-due"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending || noContacts}>
              {pending ? "Saving…" : debt ? "Save changes" : "Save debt"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
