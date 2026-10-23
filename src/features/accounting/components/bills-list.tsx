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

import {
  useAddBillPayment,
  useAddBillReturn,
  useBills,
  useDeleteBill,
  useRemoveBillPayment,
  useRemoveBillReturn,
} from "../hooks"
import { billHtml } from "../print"
import {
  billNetCents,
  billOutstandingCents,
  billTotalCents,
  paidCents,
  paymentStatus,
  returnedCents,
} from "../totals"
import { AmountRecordsDialog } from "./amount-records-dialog"
import { BillDialog } from "./bill-dialog"
import { PrintButton } from "./print-button"

export function BillsList() {
  const query = useBills()
  const deleteBill = useDeleteBill()
  const addReturn = useAddBillReturn()
  const removeReturn = useRemoveBillReturn()
  const addPayment = useAddBillPayment()
  const removePayment = useRemoveBillPayment()
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
            <TableHead className="w-40">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagination.pageItems.map((bill) => {
            const outstanding = billOutstandingCents(bill)
            const status = paymentStatus(bill, today, outstanding)
            const returned = returnedCents(bill)
            const paid = paidCents(bill)
            const total = billTotalCents(bill)
            const net = billNetCents(bill)
            return (
              <TableRow key={bill.id}>
                <TableCell className="font-medium whitespace-normal wrap-break-word">{bill.vendor}</TableCell>
                <TableCell className="whitespace-normal wrap-break-word text-muted-foreground">
                  {bill.reference ?? "—"}
                </TableCell>
                <TableCell className="tabular-nums">{bill.dueDate}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(net, bill.currency)}
                  {returned > 0 && (
                    <div className="text-xs font-normal text-muted-foreground">
                      {formatMoney(total, bill.currency)} − returned {formatMoney(returned, bill.currency)}
                    </div>
                  )}
                  {paid > 0 && (
                    <div className="text-xs font-normal text-muted-foreground">
                      paid {formatMoney(paid, bill.currency)} · left {formatMoney(outstanding, bill.currency)}
                    </div>
                  )}
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
                    <AmountRecordsDialog
                      kind="payment"
                      itemLabel={`bill from ${bill.vendor}`}
                      currency={bill.currency}
                      totalCents={net}
                      limitCents={outstanding}
                      records={bill.payments.map((item) => ({ ...item, text: item.note }))}
                      onAdd={({ text, ...rest }) =>
                        addPayment.mutateAsync({ id: bill.id, input: { ...rest, note: text } })
                      }
                      onRemove={(paymentId) => removePayment.mutateAsync({ id: bill.id, paymentId })}
                    />
                    <AmountRecordsDialog
                      kind="return"
                      itemLabel={`bill from ${bill.vendor}`}
                      currency={bill.currency}
                      totalCents={total}
                      limitCents={total - returned - paid}
                      records={bill.returns.map((item) => ({ ...item, text: item.reason }))}
                      onAdd={({ text, ...rest }) =>
                        addReturn.mutateAsync({ id: bill.id, input: { ...rest, reason: text } })
                      }
                      onRemove={(returnId) => removeReturn.mutateAsync({ id: bill.id, returnId })}
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
