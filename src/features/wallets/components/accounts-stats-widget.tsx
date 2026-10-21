"use client"

import { StatList } from "@/components/dashboard/stat-list"
import { combineQueries, WidgetCard } from "@/components/dashboard/widget-card"

import { useAccounts, useTransactions } from "../hooks"

export function AccountsStatsWidget() {
  const accountsQuery = useAccounts()
  const transactionsQuery = useTransactions()
  const query = combineQueries(accountsQuery, transactionsQuery)

  const accounts = accountsQuery.data ?? []
  const counts = new Map<string, number>()
  for (const transaction of transactionsQuery.data ?? []) {
    if (transaction.accountId) {
      counts.set(transaction.accountId, (counts.get(transaction.accountId) ?? 0) + 1)
    }
  }

  const inUse = accounts.filter((account) => counts.has(account.id)).length
  const busiest = accounts
    .map((account) => ({ account, count: counts.get(account.id) ?? 0 }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count)[0]

  return (
    <WidgetCard
      title="Accounts"
      description="Statistics"
      query={query}
      isEmpty={accounts.length === 0}
      emptyMessage="No accounts yet."
    >
      <StatList
        items={[
          { label: "Total accounts", value: String(accounts.length) },
          { label: "In use", value: String(inUse) },
          { label: "Unused", value: String(accounts.length - inUse) },
          {
            label: "Most used",
            value: busiest ? `${busiest.account.name} (${busiest.count})` : "—",
          },
        ]}
      />
    </WidgetCard>
  )
}
