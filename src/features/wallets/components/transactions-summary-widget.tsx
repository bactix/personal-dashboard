"use client"

import Link from "next/link"

import { ScrollList } from "@/components/dashboard/scroll-list"
import { WidgetCard } from "@/components/dashboard/widget-card"
import { formatMoney } from "@/lib/money"
import { cn } from "@/lib/utils"

import { signedCents } from "../balances"
import { useTransactions, useWallets } from "../hooks"

const RECENT_COUNT = 5

export function TransactionsSummaryWidget() {
  const query = useTransactions()
  const wallets = useWallets()
  // The API returns newest first.
  const recent = (query.data ?? []).slice(0, RECENT_COUNT)
  const walletById = new Map(wallets.data?.map((wallet) => [wallet.id, wallet]))

  return (
    <WidgetCard
      title="Transactions"
      description="Last 5"
      query={query}
      isEmpty={recent.length === 0}
      emptyMessage="No transactions yet."
    >
      <div className="flex flex-col gap-3">
        <ScrollList label="Last 5 transactions, newest first">
          {recent.map((transaction) => {
            const wallet = walletById.get(transaction.walletId)
            const signed = signedCents(transaction)
            return (
              <li key={transaction.id} className="flex items-center justify-between gap-2 py-2">
                <span className="min-w-0 truncate">
                  {wallet?.name ?? "Unknown wallet"}
                  <span className="text-muted-foreground"> · {transaction.date}</span>
                </span>
                <span
                  className={cn(
                    "shrink-0 font-medium tabular-nums",
                    signed < 0 && "text-destructive"
                  )}
                >
                  {signed > 0 ? "+" : "−"}
                  {formatMoney(Math.abs(signed), wallet?.currency ?? "USD")}
                </span>
              </li>
            )
          })}
        </ScrollList>
        <Link
          href="/financial/transactions"
          className="w-fit text-sm text-primary underline-offset-4 hover:underline"
        >
          View transactions
        </Link>
      </div>
    </WidgetCard>
  )
}
