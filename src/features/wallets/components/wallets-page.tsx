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
import { formatMoney } from "@/lib/money"
import { formatCreatedDate } from "@/lib/dates"

import { computeBalances } from "../balances"
import { useDeleteWallet, useTransactions, useWallets } from "../hooks"
import { TransferDialog } from "./transfer-dialog"
import { WalletDialog } from "./wallet-dialog"

export function WalletsPage() {
  const query = useWallets()
  const deleteWallet = useDeleteWallet()
  const transactions = useTransactions()
  const wallets = query.data ?? []
  const pagination = usePagination(wallets)
  const balances = computeBalances(transactions.data ?? [], wallets)

  return (
    <div className="px-4 lg:px-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <WidgetCard
          title="Wallets"
          description={query.data ? `${wallets.length} total` : undefined}
          query={query}
          action={
            <>
              <TransferDialog />
              <WalletDialog />
            </>
          }
          isEmpty={wallets.length === 0}
          emptyMessage="No wallets yet. Use Add wallet to create one, then record transactions."
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-20">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.pageItems.map((wallet) => (
                <TableRow key={wallet.id}>
                  <TableCell className="font-medium whitespace-normal break-words">
                    {wallet.name}
                  </TableCell>
                  <TableCell>{wallet.currency}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {transactions.isPending
                      ? "…"
                      : formatMoney(balances.get(wallet.id) ?? 0, wallet.currency)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">{formatCreatedDate(wallet.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end">
                      <WalletDialog wallet={wallet} />
                      <DeleteButton
                        itemLabel={`wallet “${wallet.name}”`}
                        onDelete={() => deleteWallet.mutateAsync(wallet.id)}
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
