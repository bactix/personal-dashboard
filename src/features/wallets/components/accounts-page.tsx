"use client"

import { DeleteButton } from "@/components/dashboard/delete-button"
import { ListPagination } from "@/components/dashboard/list-pagination"
import { WidgetCard } from "@/components/dashboard/widget-card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { usePagination } from "@/hooks/use-pagination"

import { useAccounts, useDeleteAccount, useTransactions } from "../hooks"
import { AccountDialog } from "./account-dialog"

export function AccountsPage() {
  const query = useAccounts()
  const deleteAccount = useDeleteAccount()
  const transactions = useTransactions()
  const accounts = query.data ?? []
  const pagination = usePagination(accounts)

  const countByAccount = new Map<string, number>()
  for (const transaction of transactions.data ?? []) {
    if (transaction.accountId) {
      countByAccount.set(transaction.accountId, (countByAccount.get(transaction.accountId) ?? 0) + 1)
    }
  }

  return (
    <div className="px-4 lg:px-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <WidgetCard
          title="Accounts"
          description={query.data ? `${accounts.length} total` : undefined}
          query={query}
          action={<AccountDialog />}
          isEmpty={accounts.length === 0}
          emptyMessage="No accounts yet. Use Add account to create one, then assign transactions to it."
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Transactions</TableHead>
                <TableHead className="w-20">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.pageItems.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium whitespace-normal break-words">
                    {account.name}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {transactions.isPending ? "…" : (countByAccount.get(account.id) ?? 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end">
                      <AccountDialog account={account} />
                      <DeleteButton
                        itemLabel={`account “${account.name}”`}
                        onDelete={() => deleteAccount.mutateAsync(account.id)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <ListPagination pagination={pagination} />
        </WidgetCard>
      </div>
    </div>
  )
}
