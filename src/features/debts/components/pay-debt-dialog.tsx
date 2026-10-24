"use client"

import { HandCoinsIcon } from "lucide-react"
import Link from "next/link"
import { useState, type FormEvent } from "react"

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
import { useWallets } from "@/features/wallets"
import { useToday } from "@/hooks/use-today"
import { userMessage } from "@/lib/http/errors"
import { formatMoney, parseAmountToCents } from "@/lib/money"

import { usePayDebt } from "../hooks"
import { remainingCents } from "../totals"
import { payDebtInputSchema, type Debt } from "../types"

/** Cents -> the text a person would type, e.g. 2550 -> "25.50". */
const toAmountText = (cents: number) => (cents / 100).toFixed(2)

/** Pays part or all of a debt from a wallet; the payment also lands in that wallet's transactions. */
export function PayDebtDialog({ debt, contactName }: { debt: Debt; contactName: string }) {
  const wallets = useWallets()
  const payDebt = usePayDebt()
  const today = useToday()
  const remaining = remainingCents(debt)
  const owing = debt.direction === "i-owe"

  const [open, setOpen] = useState(false)
  const [walletId, setWalletId] = useState("")
  const [amount, setAmount] = useState(toAmountText(remaining))
  const [date, setDate] = useState("")
  const [error, setError] = useState<string | null>(null)

  const matching = (wallets.data ?? []).filter((wallet) => wallet.currency === debt.currency)

  /** Resets the form to a full payment. Runs on open and close. */
  function load() {
    setWalletId(matching.length === 1 ? matching[0].id : "")
    setAmount(toAmountText(remaining))
    setDate("")
    setError(null)
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const amountCents = parseAmountToCents(amount)
    if (amountCents === null) return setError("Enter a valid amount, e.g. 25 or 25.50.")
    if (amountCents > remaining) {
      return setError(`Only ${formatMoney(remaining, debt.currency)} is left on this debt.`)
    }

    const parsed = payDebtInputSchema.safeParse({
      walletId,
      amountCents,
      date: date || today,
    })
    if (!parsed.success) return setError(parsed.error.issues[0].message)

    setError(null)
    payDebt.mutate(
      { id: debt.id, input: parsed.data },
      {
        onSuccess: () => {
          setOpen(false)
          load()
        },
        onError: (caught) =>
          setError(userMessage(caught, "Could not record the payment. Try again.")),
      }
    )
  }

  const noWallet = wallets.isSuccess && matching.length === 0

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        load()
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <HandCoinsIcon /> {owing ? "Pay" : "Receive"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{owing ? `Pay ${contactName}` : `Receive from ${contactName}`}</DialogTitle>
            <DialogDescription>
              {formatMoney(remaining, debt.currency)} left of{" "}
              {formatMoney(debt.amountCents, debt.currency)}.{" "}
              {owing
                ? "The amount is taken out of the wallet you choose."
                : "The amount is added to the wallet you choose."}{" "}
              It shows up in that wallet&apos;s transactions.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label>Wallet</Label>
            {noWallet ? (
              <p className="text-sm text-muted-foreground">
                No {debt.currency} wallet yet.{" "}
                <Link href="/financial/wallets" className="underline underline-offset-4">
                  Add one first
                </Link>
                .
              </p>
            ) : (
              <Select value={walletId} onValueChange={setWalletId}>
                <SelectTrigger className="w-full" aria-label="Wallet">
                  <SelectValue placeholder="Select a wallet" />
                </SelectTrigger>
                <SelectContent>
                  {matching.map((wallet) => (
                    <SelectItem key={wallet.id} value={wallet.id}>
                      {wallet.name} · {wallet.currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="pay-amount">Amount ({debt.currency})</Label>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0"
                onClick={() => setAmount(toAmountText(remaining))}
              >
                Full amount
              </Button>
            </div>
            <Input
              id="pay-amount"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="pay-date">Date</Label>
            <Input
              id="pay-date"
              type="date"
              value={date || today || ""}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={payDebt.isPending || noWallet}>
              {payDebt.isPending ? "Saving…" : owing ? "Pay" : "Record payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
