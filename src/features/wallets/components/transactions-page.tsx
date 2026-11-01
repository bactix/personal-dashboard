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
import { useBills, useInvoices } from "@/features/accounting"
import { useProjects } from "@/features/projects"
import { usePagination } from "@/hooks/use-pagination"
import { formatMoney } from "@/lib/money"
import { cn } from "@/lib/utils"
import { formatCreatedDate } from "@/lib/dates"

import { signedCents, transactionKindLabel } from "../balances"
import { useBudgets, useDeleteTransaction, useDeleteTransfer, useTransactions, useWallets } from "../hooks"
import { budgetTitle, transactionCategoryLabel, type Transaction } from "../types"
import { TransactionDialog } from "./transaction-dialog"

export function TransactionsPage() {
  const projects = useProjects()
  const invoices = useInvoices()
  const bills = useBills()
  // The invoice / vendor bill a transaction is the payment of, by transaction id.
  const relatedByTransaction = new Map<string, string>()
  for (const invoice of invoices.data ?? []) {
    for (const payment of invoice.payments) {
      if (payment.transactionId) relatedByTransaction.set(payment.transactionId, `Invoice ${invoice.number}`)
    }
  }
  for (const bill of bills.data ?? []) {
    for (const payment of bill.payments) {
      if (payment.transactionId) {
        relatedByTransaction.set(payment.transactionId, `Bill · ${bill.vendor}${bill.reference ? ` (${bill.reference})` : ""}`)
      }
    }
  }
  const projectNameById = new Map(projects.data?.map((project) => [project.id, project.name]))
  /** Transfers are moves between your own wallets; older transactions have no category. */
  const categoryText = (transaction: Transaction) => {
    if (transaction.transferId) return "Transfer"
    if (!transaction.category) return "—"
    if (transaction.category === "project") {
      return `Projects · ${(transaction.projectId && projectNameById.get(transaction.projectId)) || "Unknown project"}`
    }
    return transactionCategoryLabel(transaction.category)
  }

  const query = useTransactions()
  const deleteTransaction = useDeleteTransaction()
  const deleteTransfer = useDeleteTransfer()
  const wallets = useWallets()
  const budgets = useBudgets()
  const transactions = query.data ?? []
  const pagination = usePagination(transactions)
  const walletById = new Map(wallets.data?.map((wallet) => [wallet.id, wallet]))
  const budgetNameById = new Map(budgets.data?.map((budget) => [budget.id, budgetTitle(budget)]))

  return (
    <div className="px-4 lg:px-6">
      <div className="flex flex-col gap-4">
        <WidgetCard
          title="Transactions"
          description={query.data ? `${transactions.length} total` : undefined}
          query={query}
          action={
            <>
              <TransactionDialog kind="deposit" />
              <TransactionDialog kind="withdrawal" />
            </>
          }
          isEmpty={transactions.length === 0}
          emptyMessage="No transactions yet. Use Add money or Take money to record one."
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Wallet</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Related to</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Created</TableHead>
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
                    <TableCell>
                      <Badge variant={transaction.type === "deposit" ? "secondary" : "outline"}>
                        {transactionKindLabel(transaction)}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-normal wrap-break-word">{categoryText(transaction)}</TableCell>
                    <TableCell className="whitespace-normal wrap-break-word text-muted-foreground">
                      {relatedByTransaction.get(transaction.id) ?? "—"}
                    </TableCell>
                    <TableCell className="whitespace-normal wrap-break-word text-muted-foreground">
                      {transaction.budgetId ? (budgetNameById.get(transaction.budgetId) ?? "Unknown budget") : "—"}
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
                    <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">{formatCreatedDate(transaction.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end">
                        {transaction.transferId ? (
                          // A transfer has two sides; it can only be removed as a whole.
                          <DeleteButton
                            itemLabel="transfer (both sides)"
                            onDelete={() => deleteTransfer.mutateAsync(transaction.transferId!)}
                          />
                        ) : (
                          <>
                            <TransactionDialog transaction={transaction} />
                            <DeleteButton
                              itemLabel={"transaction"}
                              onDelete={() => deleteTransaction.mutateAsync(transaction.id)}
                            />
                          </>
                        )}
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
