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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { billOutstandingCents, invoiceOutstandingCents, useBills, useInvoices } from "@/features/accounting"
import { useProjects } from "@/features/projects"
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
  TRANSACTION_CATEGORIES,
  budgetTitle,
  createTransactionInputSchema,
  type Transaction,
  type TransactionType,
} from "../types"

/** Select needs a non-empty value for the "no budget" choice. */
const NO_BUDGET = "none"

/** ...and for "not related to an invoice / vendor bill". */
const NO_RELATED = "none"

/** A project is chosen from the same dropdown as the categories, as "project:<id>". */
const PROJECT_PREFIX = "project:"

/** The dropdown value for a transaction's category ("" when it has none yet). */
function categoryValueOf(transaction?: Transaction): string {
  if (!transaction?.category) return ""
  return transaction.category === "project" && transaction.projectId
    ? `${PROJECT_PREFIX}${transaction.projectId}`
    : transaction.category
}

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
  const projects = useProjects()
  const invoices = useInvoices()
  const bills = useBills()
  const createTransaction = useCreateTransaction()
  const updateTransaction = useUpdateTransaction()
  const pending = createTransaction.isPending || updateTransaction.isPending

  const [open, setOpen] = useState(false)
  const type: TransactionType = transaction?.type ?? kind
  const [walletId, setWalletId] = useState(transaction?.walletId ?? fixedWalletId ?? "")
  const [budgetId, setBudgetId] = useState(transaction?.budgetId ?? NO_BUDGET)
  const [categoryValue, setCategoryValue] = useState(categoryValueOf(transaction))
  const [relatedId, setRelatedId] = useState(NO_RELATED)
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
  const projectList = [...(projects.data ?? [])].sort((a, b) => a.name.localeCompare(b.name))
  // The trigger shows "Projects · Name" for a project; for the other categories the item's own text.
  const chosenProject = projectList.find((project) => `${PROJECT_PREFIX}${project.id}` === categoryValue)
  // A transaction that already settles an invoice / vendor bill keeps that link (shown, not changed).
  const linkedInvoice = transaction
    ? invoices.data?.find((invoice) => invoice.payments.some((payment) => payment.transactionId === transaction.id))
    : undefined
  const linkedBill = transaction
    ? bills.data?.find((bill) => bill.payments.some((payment) => payment.transactionId === transaction.id))
    : undefined
  // Otherwise: money added can receive an open invoice, money taken out can pay an open vendor
  // bill, both in the wallet's currency.
  const relatedOptions = !selectedWallet
    ? []
    : type === "deposit"
      ? (invoices.data ?? [])
          .filter(
            (invoice) =>
              invoice.currency === selectedWallet.currency &&
              invoice.status !== "paid" &&
              invoiceOutstandingCents(invoice) > 0
          )
          .map((invoice) => ({
            id: invoice.id,
            outstandingCents: invoiceOutstandingCents(invoice),
            currency: invoice.currency,
            label: `${invoice.number} · ${invoice.customer}`,
          }))
      : (bills.data ?? [])
          .filter(
            (bill) =>
              bill.currency === selectedWallet.currency && bill.status !== "paid" && billOutstandingCents(bill) > 0
          )
          .map((bill) => ({
            id: bill.id,
            outstandingCents: billOutstandingCents(bill),
            currency: bill.currency,
            label: bill.reference ? `${bill.vendor} (${bill.reference})` : bill.vendor,
          }))
  const chosenRelated = relatedOptions.find((option) => option.id === relatedId)
  const projectTriggerText = categoryValue.startsWith(PROJECT_PREFIX)
    ? `Projects · ${chosenProject?.name ?? "…"}`
    : undefined

  /** Fills the form from the transaction (edit) or clears it (add). Runs on open and close. */
  function load() {
    setWalletId(transaction?.walletId ?? fixedWalletId ?? "")
    setBudgetId(transaction?.budgetId ?? NO_BUDGET)
    setCategoryValue(categoryValueOf(transaction))
    setRelatedId(NO_RELATED)
    setAmount(transaction ? toAmountText(transaction.amountCents) : "")
    setDate(transaction?.date ?? null)
    setNote(transaction?.note ?? "")
    setError(null)
  }

  /** Picking an invoice / vendor bill fills in what is still owed, and files a bill payment under Bills. */
  function onRelatedChange(id: string) {
    setRelatedId(id)
    const option = relatedOptions.find((item) => item.id === id)
    if (!option) return
    if (!amount.trim()) setAmount(toAmountText(option.outstandingCents))
    if (type === "withdrawal" && !categoryValue) setCategoryValue("bills")
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!selectedWallet) return setError("Choose a wallet.")
    const amountCents = parseAmountToCents(amount)
    if (amountCents === null) return setError("Enter a valid amount, e.g. 25 or 25.50.")
    if (!categoryValue) return setError("Choose a category.")
    // When editing, the server checks the balance with the old amount taken out of the picture.
    if (!transaction && type === "withdrawal" && amountCents > (balances.get(selectedWallet.id) ?? 0)) {
      return setError("Not enough money in this wallet.")
    }

    const isProject = categoryValue.startsWith(PROJECT_PREFIX)
    const parsed = createTransactionInputSchema.safeParse({
      walletId: selectedWallet.id,
      budgetId: chosenBudget?.id,
      category: isProject ? "project" : categoryValue,
      projectId: isProject ? categoryValue.slice(PROJECT_PREFIX.length) : undefined,
      invoiceId: type === "deposit" ? chosenRelated?.id : undefined,
      billId: type === "withdrawal" ? chosenRelated?.id : undefined,
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

          <div className="flex flex-col gap-2">
            <Label>Category</Label>
            <Select value={categoryValue} onValueChange={setCategoryValue}>
              <SelectTrigger className="w-full" aria-label="Category">
                <SelectValue placeholder="Select a category">{projectTriggerText}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {TRANSACTION_CATEGORIES.map(({ value, label }) =>
                  value === "project" ? (
                    <SelectGroup key={value}>
                      <SelectLabel>{label}</SelectLabel>
                      {projectList.length === 0 ? (
                        <SelectItem value="no-projects" disabled>
                          No projects yet
                        </SelectItem>
                      ) : (
                        projectList.map((project) => (
                          <SelectItem key={project.id} value={`${PROJECT_PREFIX}${project.id}`}>
                            {project.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectGroup>
                  ) : (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          {linkedInvoice || linkedBill ? (
            <div className="flex flex-col gap-1">
              <Label>{linkedInvoice ? "Invoice" : "Vendor bill"}</Label>
              <p className="text-sm font-medium">
                {linkedInvoice
                  ? `${linkedInvoice.number} · ${linkedInvoice.customer}`
                  : `${linkedBill!.vendor}${linkedBill!.reference ? ` (${linkedBill!.reference})` : ""}`}
              </p>
              <p className="text-sm text-muted-foreground">
                This transaction is its payment. Changing the amount or date updates the payment too.
              </p>
            </div>
          ) : (
            selectedWallet && (
              <div className="flex flex-col gap-2">
                <Label>{type === "deposit" ? "Invoice (optional)" : "Vendor bill (optional)"}</Label>
                <Select value={chosenRelated?.id ?? NO_RELATED} onValueChange={onRelatedChange}>
                  <SelectTrigger className="w-full" aria-label={type === "deposit" ? "Invoice" : "Vendor bill"}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_RELATED}>
                      {type === "deposit" ? "Not for an invoice" : "Not for a vendor bill"}
                    </SelectItem>
                    {relatedOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label} · {formatMoney(option.outstandingCents, option.currency as typeof selectedWallet.currency)} left
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(type === "deposit" ? invoices : bills).isSuccess && relatedOptions.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No open {selectedWallet.currency} {type === "deposit" ? "invoices" : "vendor bills"} to settle.{" "}
                    <Link
                      href={type === "deposit" ? "/financial/invoices" : "/financial/vendor-bills"}
                      className="underline underline-offset-4"
                    >
                      {type === "deposit" ? "Add an invoice" : "Add a vendor bill"}
                    </Link>
                    .
                  </p>
                )}
              </div>
            )
          )}

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
