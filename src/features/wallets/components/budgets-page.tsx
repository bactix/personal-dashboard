"use client"

import { CreatedDate } from "@/components/dashboard/created-date"
import { DeleteButton } from "@/components/dashboard/delete-button"
import { ListPagination } from "@/components/dashboard/list-pagination"
import { WidgetCard } from "@/components/dashboard/widget-card"
import { Progress } from "@/components/ui/progress"
import { useToday } from "@/hooks/use-today"
import { usePagination } from "@/hooks/use-pagination"
import { formatMoney } from "@/lib/money"
import { cn } from "@/lib/utils"

import { useBudgets, useDeleteBudget, useTransactions } from "../hooks"
import { budgetTone, spentThisMonth, type BudgetTone } from "../spending"
import { budgetCategoryLabel, budgetTitle } from "../types"
import { BudgetDialog } from "./budget-dialog"

/** Colours per budget state: the bar, and the "left / over by" text beside it. */
const TONE: Record<BudgetTone, { bar: string; text: string }> = {
  green: {
    bar: "[&>[data-slot=progress-indicator]]:bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  yellow: {
    bar: "[&>[data-slot=progress-indicator]]:bg-yellow-400",
    text: "text-yellow-600 dark:text-yellow-400",
  },
  orange: {
    bar: "[&>[data-slot=progress-indicator]]:bg-orange-500",
    text: "text-orange-600 dark:text-orange-400",
  },
  red: {
    bar: "[&>[data-slot=progress-indicator]]:bg-destructive",
    text: "text-destructive",
  },
}

export function BudgetsPage() {
  const query = useBudgets()
  const deleteBudget = useDeleteBudget()
  const transactions = useTransactions()
  const today = useToday()
  const budgets = query.data ?? []
  const pagination = usePagination(budgets)

  const month = today?.slice(0, 7)
  const ready = month !== undefined && transactions.isSuccess

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
                ready ? spentThisMonth(budget, transactions.data, month) : 0
              const percent = Math.floor((spent / budget.limitCents) * 100)
              const over = spent > budget.limitCents
              const tone = TONE[budgetTone(spent, budget.limitCents)]
              return (
                <li key={budget.id} className="flex flex-col gap-2 py-3 first:pt-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium break-words">{budgetTitle(budget)}</p>
                      <p className="text-xs text-muted-foreground">
                        {budget.name && budget.category
                          ? `${budgetCategoryLabel(budget.category)} · `
                          : ""}
                        {budget.currency} · counts withdrawals registered to it
                      </p>
                      <CreatedDate iso={budget.createdAt} />
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
                    className={cn(tone.bar)}
                  />
                  <div className="flex items-center justify-between gap-2 text-sm tabular-nums">
                    <span className="text-muted-foreground">
                      {ready ? formatMoney(spent, budget.currency) : "…"} of{" "}
                      {formatMoney(budget.limitCents, budget.currency)}
                    </span>
                    <span className={cn("font-medium", tone.text)}>
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
