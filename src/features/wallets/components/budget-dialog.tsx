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
import { userMessage } from "@/lib/http/errors"
import { CURRENCIES, parseAmountToCents, type Currency } from "@/lib/money"

import { useAccounts, useCreateBudget, useUpdateBudget } from "../hooks"
import {
  BUDGET_CATEGORIES,
  budgetTitle,
  createBudgetInputSchema,
  type Budget,
  type BudgetCategory,
} from "../types"

/** Select needs a non-empty value for the "all spending" choice. */
const ALL_SPENDING = "all"

/** Cents -> the text a person would type, e.g. 25000 -> "250.00". */
const toAmountText = (cents: number) => (cents / 100).toFixed(2)

/** Add form, or edit form when `budget` is given. */
export function BudgetDialog({ budget }: { budget?: Budget }) {
  const accounts = useAccounts()
  const createBudget = useCreateBudget()
  const updateBudget = useUpdateBudget()
  const pending = createBudget.isPending || updateBudget.isPending

  const [open, setOpen] = useState(false)
  const [name, setName] = useState(budget?.name ?? "")
  // "" = nothing chosen yet (budgets saved before categories existed start that way too).
  const [category, setCategory] = useState<BudgetCategory | "">(budget?.category ?? "")
  const [currency, setCurrency] = useState<Currency>(budget?.currency ?? "USD")
  const [limit, setLimit] = useState(budget ? toAmountText(budget.limitCents) : "")
  const [accountId, setAccountId] = useState(budget?.accountId ?? ALL_SPENDING)
  const [error, setError] = useState<string | null>(null)

  /** Fills the form from the budget (edit) or clears it (add). Runs on open and close. */
  function load() {
    setName(budget?.name ?? "")
    setCategory(budget?.category ?? "")
    setCurrency(budget?.currency ?? "USD")
    setLimit(budget ? toAmountText(budget.limitCents) : "")
    setAccountId(budget?.accountId ?? ALL_SPENDING)
    setError(null)
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const limitCents = parseAmountToCents(limit)
    if (limitCents === null) return setError("Enter a valid monthly limit, e.g. 300 or 300.50.")

    if (!category) return setError("Choose a category.")

    const parsed = createBudgetInputSchema.safeParse({
      name: name.trim() || undefined,
      category,
      currency,
      limitCents,
      accountId: accountId === ALL_SPENDING ? undefined : accountId,
    })
    if (!parsed.success) return setError(parsed.error.issues[0].message)

    setError(null)
    const handlers = {
      onSuccess: () => {
        setOpen(false)
        load()
      },
      onError: (caught: unknown) =>
        setError(userMessage(caught, "Could not save the budget. Try again.")),
    }
    if (budget) updateBudget.mutate({ id: budget.id, input: parsed.data }, handlers)
    else createBudget.mutate(parsed.data, handlers)
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
        {budget ? (
          <EditTrigger itemLabel={`budget “${budgetTitle(budget)}”`} />
        ) : (
          <Button size="sm">
            <PlusIcon /> Add budget
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{budget ? "Edit budget" : "Add budget"}</DialogTitle>
            <DialogDescription>
              A monthly spending limit. Withdrawals this month count against it.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(value) => setCategory(value as BudgetCategory)}>
              <SelectTrigger className="w-full" aria-label="Category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {BUDGET_CATEGORIES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="budget-name">Label (optional)</Label>
            <Input
              id="budget-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={60}
              placeholder="Shown instead of the category, e.g. Weekly shop"
            />
          </div>

          <div className="grid grid-cols-[1fr_6rem] gap-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="budget-limit">Monthly limit</Label>
              <Input
                id="budget-limit"
                inputMode="decimal"
                placeholder="0.00"
                value={limit}
                onChange={(event) => setLimit(event.target.value)}
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
            <Label>Counts spending from</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger className="w-full" aria-label="Account">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_SPENDING}>All spending in this currency</SelectItem>
                {accounts.data?.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    Account: {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : budget ? "Save changes" : "Save budget"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
