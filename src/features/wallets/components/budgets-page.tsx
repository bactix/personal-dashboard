"use client"

import { DeleteButton } from "@/components/dashboard/delete-button"
import { ListPagination } from "@/components/dashboard/list-pagination"
import { WidgetCard } from "@/components/dashboard/widget-card"
import { Progress } from "@/components/ui/progress"
import { useToday } from "@/hooks/use-today"
import { usePagination } from "@/hooks/use-pagination"
import { formatMoney } from "@/lib/money"
import { cn } from "@/lib/utils"

import { useAccounts, useBudgets, useDeleteBudget, useTransactions, useWallets } from "../hooks"
import { spentThisMonth } from "../spending"
import { budgetCategoryLabel, budgetTitle } from "../types"
import { BudgetDialog } from "./budget-dialog"

export function BudgetsPage() {
  const query = useBudgets()
  const deleteBudget = useDeleteBudget()
  const transactions = useTransactions()
  const wallets = useWallets()
  const accounts = useAccounts()
  const today = useToday()
  const budgets = query.data ?? []
  const pagination = usePagination(budgets)

  const month = today?.slice(0, 7)
  const ready = month !== undefined && transactions.isSuccess && wallets.isSuccess
  const accountName = new Map(accounts.data?.map((account) => [account.id, account.name]))

  return (
    <div className="px-4 lg:px-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <WidgetCard
          title="Budgets"
          description={query.data ? `${budgets.length} total · resets each month` : undefined}
          query={query}
          action={<BudgetDialog />}
          isEmpty={budgets.length === 0}
          emptyMessage="No budgets yet. Use Add budget to set a monthly spending limit."
        >
          <ul className="divide-y">
            {pagination.pageItems.map((budget) => {
              const spent =
                ready ? spentThisMonth(budget, transactions.data, wallets.data, month) : 0
              const percent = Math.floor((spent / budget.limitCents) * 100)
              const over = spent > budget.limitCents
              return (
                <li key={budget.id} className="flex flex-col gap-2 py-3 first:pt-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium break-words">{budgetTitle(budget)}</p>
                      <p className="text-xs text-muted-foreground">
                        {budget.name && budget.category
                          ? `${budgetCategoryLabel(budget.category)} · `
                          : ""}
                        {budget.accountId
                          ? `Account: ${accountName.get(budget.accountId) ?? "unknown"}`
                          : `All ${budget.currency} spending`}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center">
                      <BudgetDialog budget={budget} />
                      <DeleteButton
                        itemLabel={`budget “${budgetTitle(budget)}”`}
                        onDelete={() => deleteBudget.mutateAsync(budget.id)}
                      />
                    </div>
                  </div>
                  <Progress
                    value={Math.min(100, percent)}
                    aria-label={`${budgetTitle(budget)} spent`}
                    className={cn(over && "[&>[data-slot=progress-indicator]]:bg-destructive")}
                  />
                  <div className="flex items-center justify-between gap-2 text-sm tabular-nums">
                    <span className="text-muted-foreground">
                      {ready ? formatMoney(spent, budget.currency) : "…"} of{" "}
                      {formatMoney(budget.limitCents, budget.currency)}
                    </span>
                    <span className={cn(over ? "text-destructive" : "text-muted-foreground")}>
                      {!ready
                        ? ""
                        : over
                          ? `Over by ${formatMoney(spent - budget.limitCents, budget.currency)}`
                          : `${formatMoney(budget.limitCents - spent, budget.currency)} left`}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
          <ListPagination pagination={pagination} />
        </WidgetCard>
      </div>
    </div>
  )
}
