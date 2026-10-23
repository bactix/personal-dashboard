"use client"

import { BanknoteIcon, Undo2Icon, type LucideIcon } from "lucide-react"
import { useState, type FormEvent } from "react"

import { DeleteButton } from "@/components/dashboard/delete-button"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToday } from "@/hooks/use-today"
import { userMessage } from "@/lib/http/errors"
import { formatMoney, parseAmountToCents } from "@/lib/money"

type Kind = "return" | "payment"

/** Wording and icon per kind of record, so one dialog serves returns and payments. */
const KINDS: Record<
  Kind,
  {
    icon: LucideIcon
    title: string
    triggerLabel: string
    addLabel: string
    noteLabel: string
    empty: string
    done: string
    summary: (item: string) => string
  }
> = {
  return: {
    icon: Undo2Icon,
    title: "Returns",
    triggerLabel: "Returns",
    addLabel: "Add return",
    noteLabel: "Reason (optional)",
    empty: "No returns recorded yet.",
    done: "Nothing left to return.",
    summary: (item) => `Record money given back on ${item}.`,
  },
  payment: {
    icon: BanknoteIcon,
    title: "Payments",
    triggerLabel: "Payments",
    addLabel: "Add payment",
    noteLabel: "Note (optional)",
    empty: "No payments recorded yet.",
    done: "Fully paid.",
    summary: (item) => `Record payments on ${item}.`,
  },
}

export type AmountRecord = { id: string; date: string; amountCents: number; text?: string }
export type AmountRecordInput = { date: string; amountCents: number; text?: string }

type AmountRecordsDialogProps = {
  kind: Kind
  /** Used in labels, e.g. "invoice INV-0001" or "bill from Acme". */
  itemLabel: string
  currency: string
  /** The figure the records add up against (shown as "X of Y"), in cents. */
  totalCents: number
  /** Most that can still be added, in cents. */
  limitCents: number
  records: AmountRecord[]
  onAdd: (input: AmountRecordInput) => Promise<unknown>
  onRemove: (recordId: string) => Promise<unknown>
}

/** Lists the returns or payments of one invoice / vendor bill and records new ones. */
export function AmountRecordsDialog({
  kind,
  itemLabel,
  currency,
  totalCents,
  limitCents,
  records,
  onAdd,
  onRemove,
}: AmountRecordsDialogProps) {
  const copy = KINDS[kind]
  const Icon = copy.icon
  const today = useToday()
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState("")
  const [amount, setAmount] = useState("")
  const [text, setText] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const applied = records.reduce((sum, item) => sum + item.amountCents, 0)

  function reset() {
    setDate("")
    setAmount("")
    setText("")
    setError(null)
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const cents = parseAmountToCents(amount)
    if (cents === null) return setError("Enter a valid amount, e.g. 25.50")
    if (cents > limitCents) {
      return setError(`Can't be more than the remaining ${formatMoney(limitCents, currency)}`)
    }
    const when = date || today
    if (!when) return setError("Choose a date")

    setError(null)
    setPending(true)
    try {
      await onAdd({ date: when, amountCents: cents, text: text.trim() || undefined })
      reset()
    } catch (caught) {
      setError(userMessage(caught, "Could not save. Try again."))
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        reset()
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`${copy.triggerLabel} for ${itemLabel}`}
          title={copy.triggerLabel}
          className="text-muted-foreground"
        >
          <Icon />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>
            {copy.summary(itemLabel)} {formatMoney(applied, currency)} of {formatMoney(totalCents, currency)}.
          </DialogDescription>
        </DialogHeader>

        {records.length === 0 ? (
          <p className="text-sm text-muted-foreground">{copy.empty}</p>
        ) : (
          <ul className="divide-y text-sm">
            {records.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-2 py-2">
                <div className="flex min-w-0 flex-col">
                  <span className="font-medium tabular-nums">{formatMoney(item.amountCents, currency)}</span>
                  <span className="text-muted-foreground wrap-break-word">
                    {item.date}
                    {item.text ? ` · ${item.text}` : ""}
                  </span>
                </div>
                <DeleteButton
                  itemLabel={`this ${kind}`}
                  onDelete={() => onRemove(item.id)}
                />
              </li>
            ))}
          </ul>
        )}

        {limitCents > 0 ? (
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3 border-t pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor={`${kind}-amount`}>Amount ({currency})</Label>
                <Input
                  id={`${kind}-amount`}
                  inputMode="decimal"
                  autoComplete="off"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  aria-invalid={!!error}
                  placeholder={`Up to ${formatMoney(limitCents, currency)}`}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={`${kind}-date`}>Date</Label>
                <Input
                  id={`${kind}-date`}
                  type="date"
                  value={date || today || ""}
                  onChange={(event) => setDate(event.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${kind}-note`}>{copy.noteLabel}</Label>
              <Input
                id={`${kind}-note`}
                value={text}
                onChange={(event) => setText(event.target.value)}
                maxLength={200}
                autoComplete="off"
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" disabled={pending} className="w-fit self-end">
              {pending ? "Saving…" : copy.addLabel}
            </Button>
          </form>
        ) : (
          <p className="border-t pt-4 text-sm text-muted-foreground">{copy.done}</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
