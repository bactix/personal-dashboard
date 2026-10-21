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
import { useToday } from "@/hooks/use-today"
import { userMessage } from "@/lib/http/errors"
import { formatMoney, parseAmountToCents } from "@/lib/money"

import { computeBalances } from "../balances"
import {
  useAccounts,
  useCreateTransaction,
  useTransactions,
  useUpdateTransaction,
  useWallets,
} from "../hooks"
import { createTransactionInputSchema, type Transaction, type TransactionType } from "../types"

const TYPES: { value: TransactionType; label: string; hint: string }[] = [
  { value: "deposit", label: "Add money", hint: "Into the wallet" },
  { value: "withdrawal", label: "Take money", hint: "Out of the wallet" },
]

/** Select needs a non-empty value for the "no account" choice. */
const NO_ACCOUNT = "none"

/** Cents -> the text a person would type, e.g. 2550 -> "25.50". */
const toAmountText = (cents: number) => (cents / 100).toFixed(2)

/** Add form, or edit form when `transaction` is given. */
export function TransactionDialog({ transaction }: { transaction?: Transaction }) {
  const transactions = useTransactions()
  const wallets = useWallets()
  const accounts = useAccounts()
  const createTransaction = useCreateTransaction()
  const updateTransaction = useUpdateTransaction()
  const pending = createTransaction.isPending || updateTransaction.isPending

  const [open, setOpen] = useState(false)
  const [type, setType] = useState<TransactionType>(transaction?.type ?? "deposit")
  const [walletId, setWalletId] = useState(transaction?.walletId ?? "")
  const [accountId, setAccountId] = useState(transaction?.accountId ?? NO_ACCOUNT)
  const [amount, setAmount] = useState(transaction ? toAmountText(transaction.amountCents) : "")
  const today = useToday() ?? ""
  // null = untouched, so the field follows "today" without reading the clock during render.
  const [pickedDate, setDate] = useState<string | null>(transaction?.date ?? null)
  const date = pickedDate ?? today
  const [note, setNote] = useState(transaction?.note ?? "")
  const [error, setError] = useState<string | null>(null)

  const balances = computeBalances(transactions.data ?? [])
  const walletById = new Map(wallets.data?.map((wallet) => [wallet.id, wallet]))
  const selectedWallet = walletById.get(walletId)
  const noWallets = wallets.isSuccess && wallets.data.length === 0

  /** Fills the form from the transaction (edit) or clears it (add). Runs on open and close. */
  function load() {
    setType(transaction?.type ?? "deposit")
    setWalletId(transaction?.walletId ?? "")
    setAccountId(transaction?.accountId ?? NO_ACCOUNT)
    setAmount(transaction ? toAmountText(transaction.amountCents) : "")
    setDate(transaction?.date ?? null)
    setNote(transaction?.note ?? "")
    setError(null)
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!selectedWallet) return setError("Choose a wallet.")
    const amountCents = parseAmountToCents(amount)
    if (amountCents === null) return setError("Enter a valid amount, e.g. 25 or 25.50.")
    // When editing, the server checks the balance with the old amount taken out of the picture.
    if (!transaction && type === "withdrawal" && amountCents > (balances.get(selectedWallet.id) ?? 0)) {
      return setError("Not enough money in this wallet.")
    }

    const parsed = createTransactionInputSchema.safeParse({
      walletId: selectedWallet.id,
      accountId: accountId === NO_ACCOUNT ? undefined : accountId,
      type,
      amountCents,
      date,
      note: note.trim() || undefined,
    })
    if (!parsed.success) return setError(parsed.error.issues[0].message)

    setError(null)
    const handlers = {
      onSuccess: () => {
        setOpen(false)
        load()
      },
      onError: (caught: unknown) =>
        setError(userMessage(caught, "Could not save the transaction. Try again.")),
    }
    if (transaction) updateTransaction.mutate({ id: transaction.id, input: parsed.data }, handlers)
    else createTransaction.mutate(parsed.data, handlers)
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
        {transaction ? (
          <EditTrigger itemLabel="transaction" />
        ) : (
          <Button size="sm">
            <PlusIcon /> Add transaction
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{transaction ? "Edit transaction" : "Add transaction"}</DialogTitle>
            <DialogDescription>Record money going into or out of a wallet.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Transaction type">
            {TYPES.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={type === option.value ? "default" : "outline"}
                aria-pressed={type === option.value}
                onClick={() => setType(option.value)}
                className="h-auto flex-col gap-0 py-2"
              >
                <span>{option.label}</span>
                <span className="text-xs font-normal opacity-80">{option.hint}</span>
              </Button>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Wallet</Label>
            {noWallets ? (
              <p className="text-sm text-muted-foreground">
                No wallets yet.{" "}
                <Link href="/financial/wallets" className="underline underline-offset-4">
                  Add a wallet first
                </Link>
                .
              </p>
            ) : (
              <>
                <Select value={walletId} onValueChange={setWalletId}>
                  <SelectTrigger className="w-full" aria-label="Wallet">
                    <SelectValue placeholder="Select a wallet" />
                  </SelectTrigger>
                  <SelectContent>
                    {wallets.data?.map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id}>
                        {wallet.name} ({wallet.currency})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedWallet && (
                  <p className="text-sm text-muted-foreground">
                    Balance:{" "}
                    <span className="font-medium tabular-nums text-foreground">
                      {formatMoney(balances.get(selectedWallet.id) ?? 0, selectedWallet.currency)}
                    </span>
                  </p>
                )}
              </>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Account (optional)</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger className="w-full" aria-label="Account">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_ACCOUNT}>No account</SelectItem>
                {accounts.data?.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {accounts.isSuccess && accounts.data.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No accounts yet.{" "}
                <Link href="/financial/accounts" className="underline underline-offset-4">
                  Add an account
                </Link>
                .
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="tx-amount">
                Amount{selectedWallet ? ` (${selectedWallet.currency})` : ""}
              </Label>
              <Input
                id="tx-amount"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="tx-date">Date</Label>
              <Input
                id="tx-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="tx-note">Note (optional)</Label>
            <Input
              id="tx-note"
              maxLength={200}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending || noWallets}>
              {pending ? "Saving…" : transaction ? "Save changes" : "Save transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
