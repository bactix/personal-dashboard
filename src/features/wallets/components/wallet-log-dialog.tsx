"use client"

import { HistoryIcon } from "lucide-react"

import { ListPagination } from "@/components/dashboard/list-pagination"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { useTransactions } from "../hooks"
import type { Wallet } from "../types"

/** The log of one wallet: every transaction and transfer side that touched it. */
export function WalletLogDialog({ wallet }: { wallet: Wallet }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Log of ${wallet.name}`}>
          <HistoryIcon />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{wallet.name} log</DialogTitle>
          <DialogDescription>Every transaction recorded on this wallet.</DialogDescription>
        </DialogHeader>
        <WalletLog wallet={wallet} />
      </DialogContent>
    </Dialog>
  )
}

function WalletLog({ wallet }: { wallet: Wallet }) {
  const query = useTransactions()
  const entries = (query.data ?? []).filter((transaction) => transaction.walletId === wallet.id)
  const pagination = usePagination(entries)

  if (query.isPending) return <p className="text-sm text-muted-foreground">Loading…</p>
  if (query.isError) return <p className="text-sm text-destructive">Could not load the log.</p>
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No transactions on this wallet yet.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Note</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagination.pageItems.map((transaction) => {
            const signed = signedCents(transaction)
            return (
              <TableRow key={transaction.id}>
                <TableCell className="tabular-nums">{transaction.date}</TableCell>
                <TableCell>
                  <Badge variant={transaction.type === "deposit" ? "secondary" : "outline"}>
                    {transactionKindLabel(transaction)}
                  </Badge>
                </TableCell>
                <TableCell className={cn("text-right tabular-nums", signed < 0 && "text-destructive")}>
                  {signed > 0 ? "+" : "−"}
                  {formatMoney(Math.abs(signed), wallet.currency)}
                </TableCell>
                <TableCell className="max-w-48 truncate text-muted-foreground">
                  {transaction.note ?? "—"}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      <ListPagination pagination={pagination} />
    </div>
  )
}
