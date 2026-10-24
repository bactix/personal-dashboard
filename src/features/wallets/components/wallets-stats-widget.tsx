"use client"

import { StatList } from "@/components/dashboard/stat-list"
import { combineQueries, WidgetCard } from "@/components/dashboard/widget-card"
import { CURRENCIES, formatMoney } from "@/lib/money"

import { computeBalances } from "../balances"
import { useTransactions, useWallets } from "../hooks"

export function WalletsStatsWidget() {
  const walletsQuery = useWallets()
  const transactionsQuery = useTransactions()
  const query = combineQueries(walletsQuery, transactionsQuery)

  const wallets = walletsQuery.data ?? []
  const balances = computeBalances(transactionsQuery.data ?? [], wallets)

  const totals = CURRENCIES.flatMap((currency) => {
    const inCurrency = wallets.filter((wallet) => wallet.currency === currency)
    if (inCurrency.length === 0) return []
    const total = inCurrency.reduce((sum, wallet) => sum + (balances.get(wallet.id) ?? 0), 0)
    return [{ label: `Total balance (${currency})`, value: formatMoney(total, currency) }]
  })
  const withMoney = wallets.filter((wallet) => (balances.get(wallet.id) ?? 0) > 0).length

  return (
    <WidgetCard
      title="Wallets"
      description="Statistics"
      query={query}
      isEmpty={wallets.length === 0}
      emptyMessage="No wallets yet."
    >
      <StatList
        items={[
          { label: "Total wallets", value: String(wallets.length) },
          ...totals,
          { label: "With money", value: String(withMoney) },
          { label: "Empty", value: String(wallets.length - withMoney) },
        ]}
      />
    </WidgetCard>
  )
}
