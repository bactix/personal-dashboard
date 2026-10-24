"use client"

import { StatList } from "@/components/dashboard/stat-list"
import { combineQueries, WidgetCard } from "@/components/dashboard/widget-card"
import { useToday } from "@/hooks/use-today"
import { CURRENCIES, formatMoney } from "@/lib/money"

import { computeBalances } from "../balances"
import { useGoals, useTransactions, useWallets } from "../hooks"

export function GoalsStatsWidget() {
  const goalsQuery = useGoals()
  const transactionsQuery = useTransactions()
  const walletsQuery = useWallets()
  const query = combineQueries(goalsQuery, transactionsQuery)
  const today = useToday()

  const goals = goalsQuery.data ?? []
  const balances = computeBalances(transactionsQuery.data ?? [], walletsQuery.data ?? [])
  const savedOf = (walletId: string) => Math.max(0, balances.get(walletId) ?? 0)

  const reached = goals.filter((goal) => savedOf(goal.walletId) >= goal.targetCents).length
  const pastDate = today
    ? goals.filter(
        (goal) =>
          goal.targetDate && goal.targetDate < today && savedOf(goal.walletId) < goal.targetCents
      ).length
    : null

  const progress = CURRENCIES.flatMap((currency) => {
    const inCurrency = goals.filter((goal) => goal.currency === currency)
    if (inCurrency.length === 0) return []
    const saved = inCurrency.reduce((sum, goal) => sum + savedOf(goal.walletId), 0)
    const target = inCurrency.reduce((sum, goal) => sum + goal.targetCents, 0)
    return [
      {
        label: `Saved (${currency})`,
        value: `${formatMoney(saved, currency)} of ${formatMoney(target, currency)}`,
      },
    ]
  })

  return (
    <WidgetCard
      title="Goals"
      description="Statistics"
      query={query}
      isEmpty={goals.length === 0}
      emptyMessage="No goals yet."
    >
      <StatList
        items={[
          { label: "Total goals", value: String(goals.length) },
          { label: "Reached", value: String(reached) },
          { label: "In progress", value: String(goals.length - reached) },
          { label: "Past target date", value: pastDate === null ? "…" : String(pastDate) },
          ...progress,
        ]}
      />
    </WidgetCard>
  )
}
