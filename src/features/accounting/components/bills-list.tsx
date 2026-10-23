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
import { useToday } from "@/hooks/use-today"
import { formatMoney } from "@/lib/money"
import { printHtml } from "@/lib/print/print-html"

import { useBills, useDeleteBill } from "../hooks"
import { billHtml } from "../print"
import { billTotalCents, paymentStatus } from "../totals"
import { BillDialog } from "./bill-dialog"
import { PrintButton } from "./print-button"

export function BillsList() {
  const query = useBills()
  const deleteBill = useDeleteBill()
  const today = useToday()
  const bills = query.data ?? []
  const pagination = usePagination(bills)

  return (
    <WidgetCard
      title="Vendor bills"
      description={query.data ? `${bills.length} total · money you owe` : undefined}
      query={query}
      action={<BillDialog />}
      isEmpty={bills.length === 0}
      emptyMessage="No vendor bills yet. Use Add bill to record one."
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vendor</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead>Due</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-28">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagination.pageItems.map((bill) => {
            const status = paymentStatus(bill, today)
            return (
              <TableRow key={bill.id}>
                <TableCell className="font-medium whitespace-normal break-words">{bill.vendor}</TableCell>
                <TableCell className="whitespace-normal break-words text-muted-foreground">
                  {bill.reference ?? "—"}
                </TableCell>
                <TableCell className="tabular-nums">{bill.dueDate}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(billTotalCents(bill), bill.currency)}
                </TableCell>
                <TableCell>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end">
                    <PrintButton
                      itemLabel={`bill from ${bill.vendor}`}
                      onPrint={() => printHtml(billHtml(bill))}
                    />
                    <BillDialog bill={bill} />
                    <DeleteButton
                      itemLabel={`bill from ${bill.vendor}`}
                      onDelete={() => deleteBill.mutateAsync(bill.id)}
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
  )
}
