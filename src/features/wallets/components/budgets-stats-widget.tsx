"use client"

import { StatList } from "@/components/dashboard/stat-list"
import { combineQueries, WidgetCard } from "@/components/dashboard/widget-card"
import { useToday } from "@/hooks/use-today"

import { useBudgets, useTransactions } from "../hooks"
import { spentThisMonth } from "../spending"
import { budgetTitle } from "../types"

export function BudgetsStatsWidget() {
  const budgetsQuery = useBudgets()
  const transactionsQuery = useTransactions()
  const query = combineQueries(budgetsQuery, transactionsQuery)
  const today = useToday()

  const budgets = budgetsQuery.data ?? []
  const month = today?.slice(0, 7)

  const usage =
    month && transactionsQuery.data
      ? budgets.map((budget) => {
          const spent = spentThisMonth(budget, transactionsQuery.data, month)
          return { budget, spent, ratio: spent / budget.limitCents }
        })
      : null

  const over = usage?.filter((entry) => entry.ratio > 1).length
  const closest = usage?.slice().sort((a, b) => b.ratio - a.ratio)[0]

  return (
    <WidgetCard
      title="Budgets"
      description="Statistics · this month"
      query={query}
      isEmpty={budgets.length === 0}
      emptyMessage="No budgets yet."
    >
      <StatList
        items={[
          { label: "Total budgets", value: String(budgets.length) },
          { label: "Over budget", value: over === undefined ? "…" : String(over) },
          {
            label: "Within budget",
            value: over === undefined ? "…" : String(budgets.length - over),
          },
          {
            label: "Closest to limit",
            value: closest ? `${budgetTitle(closest.budget)} (${Math.round(closest.ratio * 100)}%)` : "—",
          },
        ]}
      />
    </WidgetCard>
  )
}
