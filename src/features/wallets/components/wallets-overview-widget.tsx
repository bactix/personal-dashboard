"use client"

import Link from "next/link"

import { ScrollList } from "@/components/dashboard/scroll-list"
import { combineQueries, WidgetCard } from "@/components/dashboard/widget-card"
import { CURRENCIES, formatMoney } from "@/lib/money"
import { cn } from "@/lib/utils"

import { computeBalances } from "../balances"
import { useTransactions, useWallets } from "../hooks"

/** One tile: the totals (wallet count + balance per currency) above the list of wallets. */
export function WalletsOverviewWidget() {
  const walletsQuery = useWallets()
  const transactionsQuery = useTransactions()
  const query = combineQueries(walletsQuery, transactionsQuery)

  const wallets = walletsQuery.data ?? []
  const balances = computeBalances(transactionsQuery.data ?? [], wallets)

  const totals = CURRENCIES.flatMap((currency) => {
    const inCurrency = wallets.filter((wallet) => wallet.currency === currency)
    if (inCurrency.length === 0) return []
    const total = inCurrency.reduce((sum, wallet) => sum + (balances.get(wallet.id) ?? 0), 0)
    return [{ currency, total }]
  })

  return (
    <WidgetCard
      title="Wallets"
      description={`${wallets.length} total`}
      query={query}
      isEmpty={wallets.length === 0}
      emptyMessage="No wallets yet."
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1 border-b pb-3">
          <p className="text-sm text-muted-foreground">Total balance</p>
          {totals.map(({ currency, total }) => (
            <p
              key={currency}
              className={cn("text-2xl font-semibold tabular-nums", total < 0 && "text-destructive")}
            >
              {formatMoney(total, currency)}
            </p>
          ))}
        </div>
        <ScrollList label="Wallets and their balances">
          {wallets.map((wallet) => {
            const balance = balances.get(wallet.id) ?? 0
            return (
              <li key={wallet.id} className="flex items-center justify-between gap-2 py-2">
                <span className="min-w-0 truncate">{wallet.name}</span>
                <span
                  className={cn("shrink-0 font-medium tabular-nums", balance < 0 && "text-destructive")}
                >
                  {formatMoney(balance, wallet.currency)}
                </span>
              </li>
            )
          })}
        </ScrollList>
        <Link
          href="/financial/wallets"
          className="w-fit text-sm text-primary underline-offset-4 hover:underline"
        >
          View wallets
        </Link>
      </div>
    </WidgetCard>
  )
}
