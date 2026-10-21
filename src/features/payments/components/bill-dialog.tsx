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
import { CURRENCIES, formatMoney, parseAmountToCents, type Currency } from "@/lib/money"

import { useCreateBill, useUpdateBill } from "../hooks"
import { BILL_STATUSES, createBillInputSchema, type Bill, type BillStatus } from "../types"

/** Cents -> the text a person would type, e.g. 2550 -> "25.50". */
const toAmountText = (cents: number) => (cents / 100).toFixed(2)

/** Blank when there is no discount, so the field starts empty. */
const discountText = (cents?: number) => (cents ? toAmountText(cents) : "")

/** Add form, or edit form when `bill` is given. */
export function BillDialog({ bill }: { bill?: Bill }) {
  const createBill = useCreateBill()
  const updateBill = useUpdateBill()
  const pending = createBill.isPending || updateBill.isPending
  const today = useToday() ?? ""

  const [open, setOpen] = useState(false)
  const [vendor, setVendor] = useState(bill?.vendor ?? "")
  const [reference, setReference] = useState(bill?.reference ?? "")
  const [amount, setAmount] = useState(bill ? toAmountText(bill.amountCents) : "")
  const [currency, setCurrency] = useState<Currency>(bill?.currency ?? "USD")
  const [discount, setDiscount] = useState(discountText(bill?.discountCents))
  // null = untouched, so the field follows "today" without reading the clock during render.
  const [pickedBill, setBillDate] = useState<string | null>(bill?.billDate ?? null)
  const [pickedDue, setDueDate] = useState<string | null>(bill?.dueDate ?? null)
  const billDate = pickedBill ?? today
  const dueDate = pickedDue ?? billDate
  const [status, setStatus] = useState<BillStatus>(bill?.status ?? "unpaid")
  const [notes, setNotes] = useState(bill?.notes ?? "")
  const [error, setError] = useState<string | null>(null)

  /** Fills the form from the bill (edit) or clears it (add). Runs on open and close. */
  function load() {
    setVendor(bill?.vendor ?? "")
    setReference(bill?.reference ?? "")
    setAmount(bill ? toAmountText(bill.amountCents) : "")
    setCurrency(bill?.currency ?? "USD")
    setDiscount(discountText(bill?.discountCents))
    setBillDate(bill?.billDate ?? null)
    setDueDate(bill?.dueDate ?? null)
    setStatus(bill?.status ?? "unpaid")
    setNotes(bill?.notes ?? "")
    setError(null)
  }

  const amountCents = parseAmountToCents(amount)
  // Blank means no discount; anything else must be a valid amount (parseAmountToCents rejects 0).
  const discountCents = discount.trim() === "" ? 0 : parseAmountToCents(discount)
  const total =
    amountCents !== null && discountCents !== null ? Math.max(0, amountCents - discountCents) : null

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (amountCents === null) return setError("Enter a valid amount, e.g. 250 or 250.50.")
    if (discountCents === null) return setError("Enter a valid discount, e.g. 10 or 10.50, or leave it empty.")

    const parsed = createBillInputSchema.safeParse({
      vendor,
      reference: reference.trim() || undefined,
      currency,
      amountCents,
      discountCents,
      billDate,
      dueDate,
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
        setError(userMessage(caught, "Could not save the bill. Try again.")),
    }
    if (bill) updateBill.mutate({ id: bill.id, input: parsed.data }, handlers)
    else createBill.mutate(parsed.data, handlers)
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
        {bill ? (
          <EditTrigger itemLabel={`bill from ${bill.vendor}`} />
        ) : (
          <Button size="sm">
            <PlusIcon /> Add bill
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{bill ? "Edit vendor bill" : "Add vendor bill"}</DialogTitle>
            <DialogDescription>Money you owe a vendor.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="bill-vendor">Vendor</Label>
              <Input
                id="bill-vendor"
                value={vendor}
                onChange={(event) => setVendor(event.target.value)}
                maxLength={80}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="bill-reference">Vendor reference (optional)</Label>
              <Input
                id="bill-reference"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                maxLength={60}
                placeholder="Their invoice number"
              />
            </div>
          </div>

          <div className="grid grid-cols-[1fr_6rem] gap-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="bill-amount">Amount (before discount)</Label>
              <Input
                id="bill-amount"
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

          <div className="grid gap-3 sm:grid-cols-2 sm:items-end">
            <div className="flex flex-col gap-2">
              <Label htmlFor="bill-discount">Discount (optional)</Label>
              <Input
                id="bill-discount"
                inputMode="decimal"
                placeholder="0.00"
                value={discount}
                onChange={(event) => setDiscount(event.target.value)}
              />
            </div>
            <dl className="flex flex-col gap-1 text-sm tabular-nums" aria-live="polite">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Amount</dt>
                <dd>{amountCents === null ? "—" : formatMoney(amountCents, currency)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Discount</dt>
                <dd>
                  {discountCents === null
                    ? "—"
                    : discountCents === 0
                      ? formatMoney(0, currency)
                      : `−${formatMoney(discountCents, currency)}`}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-t pt-1 font-medium">
                <dt>Total</dt>
                <dd>{total === null ? "—" : formatMoney(total, currency)}</dd>
              </div>
            </dl>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="bill-date">Bill date</Label>
              <Input
                id="bill-date"
                type="date"
                value={billDate}
                onChange={(event) => setBillDate(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="bill-due">Due date</Label>
              <Input
                id="bill-due"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as BillStatus)}>
                <SelectTrigger className="w-full" aria-label="Status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BILL_STATUSES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="bill-notes">Notes (optional)</Label>
            <Textarea
              id="bill-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={500}
              rows={2}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : bill ? "Save changes" : "Save bill"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
