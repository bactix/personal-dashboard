"use client"

import { MinusIcon, PlusIcon } from "lucide-react"
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
  useBudgets,
  useCreateTransaction,
  useTransactions,
  useUpdateTransaction,
  useWallets,
} from "../hooks"
import {
  budgetTitle,
  createTransactionInputSchema,
  type Transaction,
  type TransactionType,
} from "../types"

/** Select needs a non-empty value for the "no budget" choice. */
const NO_BUDGET = "none"

/** Cents -> the text a person would type, e.g. 2550 -> "25.50". */
const toAmountText = (cents: number) => (cents / 100).toFixed(2)

/**
 * Add form, or edit form when `transaction` is given. A new transaction is either money added
 * (`kind="deposit"`) or money taken out (`kind="withdrawal"`): each has its own button, so the
 * form never asks which one. An edited transaction keeps the kind it already has.
 */
export function TransactionDialog({
  transaction,
  kind = "deposit",
  fixedWalletId,
}: {
  transaction?: Transaction
  kind?: TransactionType
  /** Locks a new transaction to this wallet (used by goals) instead of asking for one. */
  fixedWalletId?: string
}) {
  const transactions = useTransactions()
  const wallets = useWallets()
  const budgets = useBudgets()
  const createTransaction = useCreateTransaction()
  const updateTransaction = useUpdateTransaction()
  const pending = createTransaction.isPending || updateTransaction.isPending

  const [open, setOpen] = useState(false)
  const type: TransactionType = transaction?.type ?? kind
  const [walletId, setWalletId] = useState(transaction?.walletId ?? fixedWalletId ?? "")
  const [budgetId, setBudgetId] = useState(transaction?.budgetId ?? NO_BUDGET)
  const [amount, setAmount] = useState(transaction ? toAmountText(transaction.amountCents) : "")
  const today = useToday() ?? ""
  // null = untouched, so the field follows "today" without reading the clock during render.
  const [pickedDate, setDate] = useState<string | null>(transaction?.date ?? null)
  const date = pickedDate ?? today
  const [note, setNote] = useState(transaction?.note ?? "")
  const [error, setError] = useState<string | null>(null)

  const balances = computeBalances(transactions.data ?? [], wallets.data ?? [])
  const walletById = new Map(wallets.data?.map((wallet) => [wallet.id, wallet]))
  const selectedWallet = walletById.get(walletId)
  const noWallets = wallets.isSuccess && wallets.data.length === 0
  // Only money taken out can be registered to a budget, and only one in the wallet's currency.
  const budgetOptions =
    type === "withdrawal" && selectedWallet
      ? (budgets.data ?? []).filter((budget) => budget.currency === selectedWallet.currency)
      : []
  const chosenBudget = budgetOptions.find((budget) => budget.id === budgetId)

  /** Fills the form from the transaction (edit) or clears it (add). Runs on open and close. */
  function load() {
    setWalletId(transaction?.walletId ?? fixedWalletId ?? "")
    setBudgetId(transaction?.budgetId ?? NO_BUDGET)
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
      budgetId: chosenBudget?.id,
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
        ) : type === "deposit" ? (
          <Button size="sm">
            <PlusIcon /> Add money
          </Button>
        ) : (
          <Button size="sm" variant="outline">
            <MinusIcon /> Take money
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>
              {transaction
                ? type === "deposit"
                  ? "Edit money added"
                  : "Edit money taken"
                : type === "deposit"
                  ? "Add money"
                  : "Take money"}
            </DialogTitle>
            <DialogDescription>
              {type === "deposit"
                ? "Put money into a wallet."
                : "Take money out of a wallet. You can count it against a budget."}
            </DialogDescription>
          </DialogHeader>

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
                {fixedWalletId && !transaction ? (
                  <p className="text-sm font-medium">
                    {selectedWallet ? `${selectedWallet.name} (${selectedWallet.currency})` : "…"}
                  </p>
                ) : (
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
                )}
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

          {type === "withdrawal" && selectedWallet && (
            <div className="flex flex-col gap-2">
              <Label>Budget (optional)</Label>
              <Select value={chosenBudget?.id ?? NO_BUDGET} onValueChange={setBudgetId}>
                <SelectTrigger className="w-full" aria-label="Budget">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_BUDGET}>No budget</SelectItem>
                  {budgetOptions.map((budget) => (
                    <SelectItem key={budget.id} value={budget.id}>
                      {budgetTitle(budget)} · {formatMoney(budget.limitCents, budget.currency)} / month
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {budgets.isSuccess && budgetOptions.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No {selectedWallet.currency} budgets yet.{" "}
                  <Link href="/financial/budgets" className="underline underline-offset-4">
                    Add a budget
                  </Link>
                  .
                </p>
              )}
            </div>
          )}

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
              {pending ? "Saving…" : transaction ? "Save changes" : type === "deposit" ? "Add money" : "Take money"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
