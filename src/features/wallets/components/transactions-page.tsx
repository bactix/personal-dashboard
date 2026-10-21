"use client"

import { DeleteButton } from "@/components/dashboard/delete-button"
import { ListPagination } from "@/components/dashboard/list-pagination"
import { WidgetCard } from "@/components/dashboard/widget-card"
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

import { signedCents } from "../balances"
import { useAccounts, useDeleteTransaction, useTransactions, useWallets } from "../hooks"
import { TransactionDialog } from "./transaction-dialog"

export function TransactionsPage() {
  const query = useTransactions()
  const deleteTransaction = useDeleteTransaction()
  const wallets = useWallets()
  const accounts = useAccounts()
  const transactions = query.data ?? []
  const pagination = usePagination(transactions)
  const walletById = new Map(wallets.data?.map((wallet) => [wallet.id, wallet]))
  const accountNameById = new Map(accounts.data?.map((account) => [account.id, account.name]))

  return (
    <div className="px-4 lg:px-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <WidgetCard
          title="Transactions"
          description={query.data ? `${transactions.length} total` : undefined}
          query={query}
          action={<TransactionDialog />}
          isEmpty={transactions.length === 0}
          emptyMessage="No transactions yet. Use Add transaction to record one."
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Wallet</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Note</TableHead>
                <TableHead className="w-20">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.pageItems.map((transaction) => {
                const wallet = walletById.get(transaction.walletId)
                const signed = signedCents(transaction)
                return (
                  <TableRow key={transaction.id}>
                    <TableCell className="tabular-nums">{transaction.date}</TableCell>
                    <TableCell className="font-medium whitespace-normal break-words">
                      {wallet?.name ?? "Unknown wallet"}
                    </TableCell>
                    <TableCell className="whitespace-normal break-words text-muted-foreground">
                      {transaction.accountId
                        ? (accountNameById.get(transaction.accountId) ?? "Unknown account")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={transaction.type === "deposit" ? "secondary" : "outline"}>
                        {transaction.type === "deposit" ? "Added" : "Taken"}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right tabular-nums",
                        signed < 0 && "text-destructive"
                      )}
                    >
                      {signed > 0 ? "+" : "−"}
                      {formatMoney(Math.abs(signed), wallet?.currency ?? "USD")}
                    </TableCell>
                    <TableCell className="max-w-48 truncate text-muted-foreground">
                      {transaction.note ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end">
                        <TransactionDialog transaction={transaction} />
                        <DeleteButton
                          itemLabel={"transaction"}
                          onDelete={() => deleteTransaction.mutateAsync(transaction.id)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <ListPagination pagination={pagination} />
        </WidgetCard>
      </div>
    </div>
  )
}
