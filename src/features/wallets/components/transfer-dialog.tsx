"use client"

import { ArrowRightLeftIcon } from "lucide-react"
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
import { useToday } from "@/hooks/use-today"
import { userMessage } from "@/lib/http/errors"
import { formatMoney, parseAmountToCents } from "@/lib/money"

import { computeBalances } from "../balances"
import { useCreateTransfer, useTransactions, useWallets } from "../hooks"
import { createTransferInputSchema } from "../types"

/** Move money from one wallet to another wallet of the same currency. */
export function TransferDialog() {
  const createTransfer = useCreateTransfer()
  const wallets = useWallets()
  const transactions = useTransactions()

  const [open, setOpen] = useState(false)
  const [fromId, setFromId] = useState("")
  const [toId, setToId] = useState("")
  const [amount, setAmount] = useState("")
  const today = useToday() ?? ""
  // null = untouched, so the field follows "today" without reading the clock during render.
  const [pickedDate, setDate] = useState<string | null>(null)
  const date = pickedDate ?? today
  const [note, setNote] = useState("")
  const [error, setError] = useState<string | null>(null)

  const all = wallets.data ?? []
  const balances = computeBalances(transactions.data ?? [], all)
  const from = all.find((wallet) => wallet.id === fromId)
  // Only wallets in the same currency, other than the source, can receive.
  const targets = from ? all.filter((wallet) => wallet.id !== from.id && wallet.currency === from.currency) : []
  const to = targets.find((wallet) => wallet.id === toId)
  const available = from ? (balances.get(from.id) ?? 0) : 0

  function load() {
    setFromId("")
    setToId("")
    setAmount("")
    setDate(null)
    setNote("")
    setError(null)
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!from) return setError("Choose the wallet to take money from.")
    if (!to) return setError("Choose the wallet to move the money into.")
    const amountCents = parseAmountToCents(amount)
    if (amountCents === null) return setError("Enter a valid amount, e.g. 25 or 25.50.")
    if (amountCents > available) {
      return setError(`${from.name} only has ${formatMoney(available, from.currency)}.`)
    }

    const parsed = createTransferInputSchema.safeParse({
      fromWalletId: from.id,
      toWalletId: to.id,
      amountCents,
      date,
      note: note.trim() || undefined,
    })
    if (!parsed.success) return setError(parsed.error.issues[0].message)

    setError(null)
    createTransfer.mutate(parsed.data, {
      onSuccess: () => {
        setOpen(false)
        load()
      },
      onError: (caught) => setError(userMessage(caught, "Could not save the transfer. Try again.")),
    })
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
        <Button size="sm" variant="outline" disabled={all.length < 2}>
          <ArrowRightLeftIcon /> Transfer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Transfer between wallets</DialogTitle>
            <DialogDescription>
              Move money from one wallet to another wallet in the same currency.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label>From</Label>
            <Select
              value={fromId}
              onValueChange={(value) => {
                setFromId(value)
                setToId("") // the receiving wallet must match the new currency
              }}
            >
              <SelectTrigger className="w-full" aria-label="From wallet">
                <SelectValue placeholder="Choose a wallet" />
              </SelectTrigger>
              <SelectContent>
                {all.map((wallet) => (
                  <SelectItem key={wallet.id} value={wallet.id}>
                    {wallet.name} · {formatMoney(balances.get(wallet.id) ?? 0, wallet.currency)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>To</Label>
            <Select value={toId} onValueChange={setToId} disabled={!from}>
              <SelectTrigger className="w-full" aria-label="To wallet">
                <SelectValue placeholder={from ? "Choose a wallet" : "Choose the From wallet first"} />
              </SelectTrigger>
              <SelectContent>
                {targets.map((wallet) => (
                  <SelectItem key={wallet.id} value={wallet.id}>
                    {wallet.name} · {formatMoney(balances.get(wallet.id) ?? 0, wallet.currency)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {from && targets.length === 0 && (
              <p className="text-xs text-muted-foreground">
                You have no other {from.currency} wallet to move money into.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="transfer-amount">Amount{from ? ` (${from.currency})` : ""}</Label>
              <Input
                id="transfer-amount"
                inputMode="decimal"
                autoComplete="off"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                aria-invalid={!!error}
                placeholder={from ? `Up to ${formatMoney(available, from.currency)}` : "0.00"}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="transfer-date">Date</Label>
              <Input
                id="transfer-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="transfer-note">Note (optional)</Label>
            <Input
              id="transfer-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={150}
              autoComplete="off"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={createTransfer.isPending}>
              {createTransfer.isPending ? "Moving…" : "Transfer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
