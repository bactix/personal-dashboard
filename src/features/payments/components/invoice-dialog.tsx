"use client"

import { PlusIcon, Trash2Icon } from "lucide-react"
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

import { useCreateInvoice, useUpdateInvoice } from "../hooks"
import { invoiceSubtotalCents } from "../totals"
import {
  INVOICE_STATUSES,
  createInvoiceInputSchema,
  type Invoice,
  type InvoiceStatus,
} from "../types"

/** A line item as typed in the form (strings until submit). */
type Row = { description: string; quantity: string; unit: string }

const emptyRow = (): Row => ({ description: "", quantity: "1", unit: "" })

/** Cents -> the text a person would type, e.g. 2550 -> "25.50". */
const toAmountText = (cents: number) => (cents / 100).toFixed(2)

const rowsOf = (invoice?: Invoice): Row[] =>
  invoice
    ? invoice.items.map((item) => ({
        description: item.description,
        quantity: String(item.quantity),
        unit: toAmountText(item.unitCents),
      }))
    : [emptyRow()]

/** Blank when there is no discount, so the field starts empty. */
const discountText = (cents?: number) => (cents ? toAmountText(cents) : "")

/** Add form, or edit form when `invoice` is given. */
export function InvoiceDialog({ invoice }: { invoice?: Invoice }) {
  const createInvoice = useCreateInvoice()
  const updateInvoice = useUpdateInvoice()
  const pending = createInvoice.isPending || updateInvoice.isPending
  const today = useToday() ?? ""

  const [open, setOpen] = useState(false)
  const [customer, setCustomer] = useState(invoice?.customer ?? "")
  const [currency, setCurrency] = useState<Currency>(invoice?.currency ?? "USD")
  const [rows, setRows] = useState<Row[]>(rowsOf(invoice))
  const [discount, setDiscount] = useState(discountText(invoice?.discountCents))
  // null = untouched, so the field follows "today" without reading the clock during render.
  const [pickedIssue, setIssueDate] = useState<string | null>(invoice?.issueDate ?? null)
  const [pickedDue, setDueDate] = useState<string | null>(invoice?.dueDate ?? null)
  const issueDate = pickedIssue ?? today
  const dueDate = pickedDue ?? issueDate
  const [status, setStatus] = useState<InvoiceStatus>(invoice?.status ?? "draft")
  const [notes, setNotes] = useState(invoice?.notes ?? "")
  const [error, setError] = useState<string | null>(null)

  /** Fills the form from the invoice (edit) or clears it (add). Runs on open and close. */
  function load() {
    setCustomer(invoice?.customer ?? "")
    setCurrency(invoice?.currency ?? "USD")
    setRows(rowsOf(invoice))
    setDiscount(discountText(invoice?.discountCents))
    setIssueDate(invoice?.issueDate ?? null)
    setDueDate(invoice?.dueDate ?? null)
    setStatus(invoice?.status ?? "draft")
    setNotes(invoice?.notes ?? "")
    setError(null)
  }

  function updateRow(index: number, patch: Partial<Row>) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  /** Rows as domain line items; null if any row has an invalid quantity or price. */
  function parseRows() {
    const items = []
    for (const row of rows) {
      const unitCents = parseAmountToCents(row.unit)
      const quantity = Number(row.quantity)
      if (unitCents === null || !Number.isInteger(quantity) || quantity < 1) return null
      items.push({ description: row.description, quantity, unitCents })
    }
    return items
  }

  const previewItems = parseRows()
  const subtotal = previewItems ? invoiceSubtotalCents(previewItems) : null
  // Blank means no discount; anything else must be a valid amount (parseAmountToCents rejects 0).
  const discountCents = discount.trim() === "" ? 0 : parseAmountToCents(discount)
  const total =
    subtotal !== null && discountCents !== null ? Math.max(0, subtotal - discountCents) : null

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!previewItems) {
      return setError("Each line item needs a whole-number quantity and a unit price, e.g. 25 or 25.50.")
    }
    if (discountCents === null) return setError("Enter a valid discount, e.g. 10 or 10.50, or leave it empty.")
    const parsed = createInvoiceInputSchema.safeParse({
      customer,
      currency,
      items: previewItems,
      discountCents,
      issueDate,
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
        setError(userMessage(caught, "Could not save the invoice. Try again.")),
    }
    if (invoice) updateInvoice.mutate({ id: invoice.id, input: parsed.data }, handlers)
    else createInvoice.mutate(parsed.data, handlers)
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
        {invoice ? (
          <EditTrigger itemLabel={`invoice ${invoice.number}`} />
        ) : (
          <Button size="sm">
            <PlusIcon /> New invoice
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{invoice ? `Edit invoice ${invoice.number}` : "New invoice"}</DialogTitle>
            <DialogDescription>
              Money a customer owes you.
              {!invoice && " The invoice number is assigned when you save."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-[1fr_6rem] gap-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="invoice-customer">Customer</Label>
              <Input
                id="invoice-customer"
                value={customer}
                onChange={(event) => setCustomer(event.target.value)}
                maxLength={80}
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

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">Line items</legend>
            {rows.map((row, index) => (
              <div key={index} className="grid grid-cols-[1fr_4rem_6rem_auto] items-center gap-2">
                <Input
                  aria-label={`Item ${index + 1} description`}
                  placeholder="Description"
                  value={row.description}
                  maxLength={120}
                  onChange={(event) => updateRow(index, { description: event.target.value })}
                />
                <Input
                  aria-label={`Item ${index + 1} quantity`}
                  inputMode="numeric"
                  placeholder="Qty"
                  value={row.quantity}
                  onChange={(event) => updateRow(index, { quantity: event.target.value })}
                />
                <Input
                  aria-label={`Item ${index + 1} unit price`}
                  inputMode="decimal"
                  placeholder="Price"
                  value={row.unit}
                  onChange={(event) => updateRow(index, { unit: event.target.value })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove item ${index + 1}`}
                  disabled={rows.length === 1}
                  onClick={() => setRows((current) => current.filter((_, i) => i !== index))}
                >
                  <Trash2Icon />
                </Button>
              </div>
            ))}
            <div className="flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={rows.length >= 50}
                onClick={() => setRows((current) => [...current, emptyRow()])}
              >
                <PlusIcon /> Add line
              </Button>
            </div>
          </fieldset>

          <div className="grid gap-3 sm:grid-cols-2 sm:items-end">
            <div className="flex flex-col gap-2">
              <Label htmlFor="invoice-discount">Discount (optional)</Label>
              <Input
                id="invoice-discount"
                inputMode="decimal"
                placeholder="0.00"
                value={discount}
                onChange={(event) => setDiscount(event.target.value)}
              />
            </div>
            <dl className="flex flex-col gap-1 text-sm tabular-nums" aria-live="polite">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{subtotal === null ? "—" : formatMoney(subtotal, currency)}</dd>
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
              <Label htmlFor="invoice-issue">Issue date</Label>
              <Input
                id="invoice-issue"
                type="date"
                value={issueDate}
                onChange={(event) => setIssueDate(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="invoice-due">Due date</Label>
              <Input
                id="invoice-due"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as InvoiceStatus)}>
                <SelectTrigger className="w-full" aria-label="Status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVOICE_STATUSES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="invoice-notes">Notes (optional)</Label>
            <Textarea
              id="invoice-notes"
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
              {pending ? "Saving…" : invoice ? "Save changes" : "Save invoice"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
