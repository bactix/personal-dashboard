"use client"

import Link from "next/link"

import { ScrollList } from "@/components/dashboard/scroll-list"
import { WidgetCard } from "@/components/dashboard/widget-card"
import { formatMoney } from "@/lib/money"
import { cn } from "@/lib/utils"

import { computeBalances } from "../balances"
import { useTransactions, useWallets } from "../hooks"

export function WalletsSummaryWidget() {
  const query = useWallets()
  const transactions = useTransactions()
  const wallets = query.data ?? []
  const balances = computeBalances(transactions.data ?? [])

  return (
    <WidgetCard
      title="Wallets"
      description={query.data ? `${wallets.length} total` : undefined}
      query={query}
      isEmpty={wallets.length === 0}
      emptyMessage="No wallets yet."
    >
      <div className="flex flex-col gap-3">
        <ScrollList label="Wallets and their balances">
          {wallets.map((wallet) => {
            const balance = balances.get(wallet.id) ?? 0
            return (
              <li key={wallet.id} className="flex items-center justify-between gap-2 py-2">
                <span className="min-w-0 truncate">{wallet.name}</span>
                <span
                  className={cn("shrink-0 font-medium tabular-nums", balance < 0 && "text-destructive")}
                >
                  {transactions.isPending ? "…" : formatMoney(balance, wallet.currency)}
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
