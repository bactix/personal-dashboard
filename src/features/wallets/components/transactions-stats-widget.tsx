"use client"

import { StatList } from "@/components/dashboard/stat-list"
import { combineQueries, WidgetCard } from "@/components/dashboard/widget-card"
import { useToday } from "@/hooks/use-today"
import { CURRENCIES, formatMoney } from "@/lib/money"

import { useTransactions, useWallets } from "../hooks"

export function TransactionsStatsWidget() {
  const transactionsQuery = useTransactions()
  const walletsQuery = useWallets()
  const query = combineQueries(transactionsQuery, walletsQuery)
  const today = useToday()

  const transactions = transactionsQuery.data ?? []
  const wallets = walletsQuery.data ?? []
  const month = today?.slice(0, 7)

  const currencyByWallet = new Map(wallets.map((wallet) => [wallet.id, wallet.currency]))
  const deposits = transactions.filter((transaction) => transaction.type === "deposit").length

  const monthly = CURRENCIES.flatMap((currency) => {
    if (!wallets.some((wallet) => wallet.currency === currency)) return []
    let received = 0
    let spent = 0
    for (const transaction of transactions) {
      if (!month || !transaction.date.startsWith(month)) continue
      if (currencyByWallet.get(transaction.walletId) !== currency) continue
      if (transaction.type === "deposit") received += transaction.amountCents
      else spent += transaction.amountCents
    }
    return [
      {
        label: `Received this month (${currency})`,
        value: month ? formatMoney(received, currency) : "…",
      },
      {
        label: `Spent this month (${currency})`,
        value: month ? formatMoney(spent, currency) : "…",
      },
    ]
  })

  return (
    <WidgetCard
      title="Transactions"
      description="Statistics"
      query={query}
      isEmpty={transactions.length === 0}
      emptyMessage="No transactions yet."
    >
      <StatList
        items={[
          { label: "Total transactions", value: String(transactions.length) },
          { label: "Deposits", value: String(deposits) },
          { label: "Withdrawals", value: String(transactions.length - deposits) },
          ...monthly,
        ]}
      />
    </WidgetCard>
  )
}
