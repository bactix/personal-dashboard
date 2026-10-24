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
import { useToday } from "@/hooks/use-today"
import { userMessage } from "@/lib/http/errors"
import { CURRENCIES, parseAmountToCents, type Currency } from "@/lib/money"

import { useCreateSubscription, useUpdateSubscription } from "../hooks"
import {
  createSubscriptionInputSchema,
  SUBSCRIPTION_CYCLES,
  SUBSCRIPTION_STATUSES,
  type Subscription,
  type SubscriptionCycle,
  type SubscriptionStatus,
} from "../types"

const toAmountText = (cents: number) => (cents / 100).toFixed(2)

/** Add form, or edit form when `subscription` is given. */
export function SubscriptionDialog({ subscription }: { subscription?: Subscription }) {
  const createSubscription = useCreateSubscription()
  const updateSubscription = useUpdateSubscription()
  const pending = createSubscription.isPending || updateSubscription.isPending

  const [open, setOpen] = useState(false)
  const [name, setName] = useState(subscription?.name ?? "")
  const [amount, setAmount] = useState(subscription ? toAmountText(subscription.amountCents) : "")
  const [currency, setCurrency] = useState<Currency>(subscription?.currency ?? "USD")
  const [cycle, setCycle] = useState<SubscriptionCycle>(subscription?.cycle ?? "monthly")
  const today = useToday() ?? ""
  // null = untouched, so a new subscription's first charge follows "today" without reading the clock in render.
  const [pickedStart, setStartDate] = useState<string | null>(subscription?.startDate ?? null)
  const startDate = pickedStart ?? today
  const [status, setStatus] = useState<SubscriptionStatus>(subscription?.status ?? "active")
  const [notes, setNotes] = useState(subscription?.notes ?? "")
  const [error, setError] = useState<string | null>(null)

  /** Fills the form from the subscription (edit) or clears it (add). Runs on open and close. */
  function load() {
    setName(subscription?.name ?? "")
    setAmount(subscription ? toAmountText(subscription.amountCents) : "")
    setCurrency(subscription?.currency ?? "USD")
    setCycle(subscription?.cycle ?? "monthly")
    setStartDate(subscription?.startDate ?? null)
    setStatus(subscription?.status ?? "active")
    setNotes(subscription?.notes ?? "")
    setError(null)
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const amountCents = parseAmountToCents(amount)
    if (amountCents === null) return setError("Enter a valid amount, e.g. 9.99.")

    const parsed = createSubscriptionInputSchema.safeParse({
      name,
      amountCents,
      currency,
      cycle,
      startDate,
      status,
      notes: notes.trim() || undefined,
    })
    if (!parsed.success) return setError(parsed.error.issues[0].message)

    setError(null)
    const handlers = {
      onSuccess: () => {
        setOpen(false)
        load()
      },
      onError: (caught: unknown) =>
        setError(userMessage(caught, "Could not save the subscription. Try again.")),
    }
    if (subscription) updateSubscription.mutate({ id: subscription.id, input: parsed.data }, handlers)
    else createSubscription.mutate(parsed.data, handlers)
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
        {subscription ? (
          <EditTrigger itemLabel={`subscription “${subscription.name}”`} />
        ) : (
          <Button size="sm">
            <PlusIcon /> Add subscription
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{subscription ? "Edit subscription" : "Add subscription"}</DialogTitle>
            <DialogDescription>
              Something you pay for again and again. The next renewal is worked out from the first
              charge date.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="subscription-name">Name</Label>
            <Input
              id="subscription-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={!!error}
              maxLength={80}
              autoComplete="off"
              placeholder="e.g. Netflix, iCloud, Gym"
            />
          </div>

          <div className="grid grid-cols-[1fr_6rem] gap-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="subscription-amount">Amount per charge</Label>
              <Input
                id="subscription-amount"
                inputMode="decimal"
                autoComplete="off"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                aria-invalid={!!error}
                placeholder="0.00"
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>Billed</Label>
              <Select value={cycle} onValueChange={(value) => setCycle(value as SubscriptionCycle)}>
                <SelectTrigger className="w-full" aria-label="Billing cycle">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUBSCRIPTION_CYCLES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="subscription-start">First charge date</Label>
              <Input
                id="subscription-start"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as SubscriptionStatus)}>
              <SelectTrigger className="w-full" aria-label="Status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUBSCRIPTION_STATUSES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="subscription-notes">Notes (optional)</Label>
            <Textarea
              id="subscription-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={500}
              rows={3}
              className="max-h-40 overflow-y-auto"
              placeholder="Plan, account email, how to cancel…"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : subscription ? "Save changes" : "Save subscription"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
