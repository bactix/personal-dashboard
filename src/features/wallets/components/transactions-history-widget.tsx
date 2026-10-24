"use client"

import Link from "next/link"

import { ListPagination } from "@/components/dashboard/list-pagination"
import { combineQueries, WidgetCard } from "@/components/dashboard/widget-card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { usePagination } from "@/hooks/use-pagination"
import { formatMoney } from "@/lib/money"
import { cn } from "@/lib/utils"

import { signedCents, transactionKindLabel } from "../balances"
import { useBudgets, useTransactions, useWallets } from "../hooks"
import { budgetTitle } from "../types"

/** Every wallet transaction, newest first (deposits, withdrawals and both sides of transfers). */
export function TransactionsHistoryWidget() {
  const transactionsQuery = useTransactions()
  const walletsQuery = useWallets()
  const budgetsQuery = useBudgets()
  const query = combineQueries(transactionsQuery, walletsQuery, budgetsQuery)

  const transactions = transactionsQuery.data ?? []
  const pagination = usePagination(transactions)
  const walletById = new Map(walletsQuery.data?.map((wallet) => [wallet.id, wallet]))
  const budgetNameById = new Map(budgetsQuery.data?.map((budget) => [budget.id, budgetTitle(budget)]))

  return (
    <WidgetCard
      title="History"
      description={transactionsQuery.data ? `${transactions.length} transactions, newest first` : "All transactions"}
      query={query}
      isEmpty={transactions.length === 0}
      emptyMessage="No transactions yet. They will show up here as you add them."
    >
      <div className="flex flex-col gap-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Wallet</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Note</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagination.pageItems.map((transaction) => {
              const wallet = walletById.get(transaction.walletId)
              const signed = signedCents(transaction)
              return (
                <TableRow key={transaction.id}>
                  <TableCell className="whitespace-nowrap tabular-nums">{transaction.date}</TableCell>
                  <TableCell className="font-medium whitespace-normal wrap-break-word">
                    {wallet?.name ?? "Unknown wallet"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        signed > 0
                          ? "border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                          : "border-transparent bg-destructive/10 text-destructive"
                      }
                    >
                      {transactionKindLabel(transaction)}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-normal wrap-break-word text-muted-foreground">
                    {transaction.budgetId ? (budgetNameById.get(transaction.budgetId) ?? "Unknown budget") : "—"}
                  </TableCell>
                  <TableCell className="max-w-56 truncate text-muted-foreground">{transaction.note ?? "—"}</TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-medium whitespace-nowrap tabular-nums",
                      // Green for money coming in, red for money going out.
                      signed > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
                    )}
                  >
                    {signed > 0 ? "+" : "−"}
                    {formatMoney(Math.abs(signed), wallet?.currency ?? "USD")}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        <ListPagination pagination={pagination} />
        <Link
          href="/financial/transactions"
          className="w-fit text-sm text-primary underline-offset-4 hover:underline"
        >
          Manage transactions
        </Link>
      </div>
    </WidgetCard>
  )
}
