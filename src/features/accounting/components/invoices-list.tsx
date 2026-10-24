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
import { formatCreatedDate } from "@/lib/dates"

import {
  useAddInvoicePayment,
  useAddInvoiceReturn,
  useDeleteInvoice,
  useInvoices,
  useRemoveInvoicePayment,
  useRemoveInvoiceReturn,
} from "../hooks"
import { invoiceHtml } from "../print"
import {
  invoiceNetCents,
  invoiceOutstandingCents,
  invoiceTotalCents,
  paidCents,
  paymentStatus,
  returnedCents,
} from "../totals"
import { AmountRecordsDialog } from "./amount-records-dialog"
import { InvoiceDialog } from "./invoice-dialog"
import { PrintButton } from "./print-button"

export function InvoicesList() {
  const query = useInvoices()
  const deleteInvoice = useDeleteInvoice()
  const addReturn = useAddInvoiceReturn()
  const removeReturn = useRemoveInvoiceReturn()
  const addPayment = useAddInvoicePayment()
  const removePayment = useRemoveInvoicePayment()
  const today = useToday()
  const invoices = query.data ?? []
  const pagination = usePagination(invoices)

  return (
    <WidgetCard
      title="Invoices"
      description={query.data ? `${invoices.length} total · money owed to you` : undefined}
      query={query}
      action={<InvoiceDialog />}
      isEmpty={invoices.length === 0}
      emptyMessage="No invoices yet. Use New invoice to bill a customer."
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Due</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-40">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagination.pageItems.map((invoice) => {
            const outstanding = invoiceOutstandingCents(invoice)
            const status = paymentStatus(invoice, today, outstanding)
            const returned = returnedCents(invoice)
            const paid = paidCents(invoice)
            const total = invoiceTotalCents(invoice)
            const net = invoiceNetCents(invoice)
            return (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium tabular-nums">{invoice.number}</TableCell>
                <TableCell className="whitespace-normal wrap-break-word">{invoice.customer}</TableCell>
                <TableCell className="tabular-nums">{invoice.dueDate}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(net, invoice.currency)}
                  {returned > 0 && (
                    <div className="text-xs font-normal text-muted-foreground">
                      {formatMoney(total, invoice.currency)} − returned {formatMoney(returned, invoice.currency)}
                    </div>
                  )}
                  {paid > 0 && (
                    <div className="text-xs font-normal text-muted-foreground">
                      paid {formatMoney(paid, invoice.currency)} · left {formatMoney(outstanding, invoice.currency)}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">{formatCreatedDate(invoice.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end">
                    <PrintButton
                      itemLabel={`invoice ${invoice.number}`}
                      onPrint={() => printHtml(invoiceHtml(invoice))}
                    />
                    <AmountRecordsDialog
                      kind="payment"
                      itemLabel={`invoice ${invoice.number}`}
                      currency={invoice.currency}
                      totalCents={net}
                      limitCents={outstanding}
                      records={invoice.payments.map((item) => ({ ...item, text: item.note }))}
                      onAdd={({ text, ...rest }) =>
                        addPayment.mutateAsync({ id: invoice.id, input: { ...rest, note: text } })
                      }
                      onRemove={(paymentId) => removePayment.mutateAsync({ id: invoice.id, paymentId })}
                    />
                    <AmountRecordsDialog
                      kind="return"
                      itemLabel={`invoice ${invoice.number}`}
                      currency={invoice.currency}
                      totalCents={total}
                      limitCents={total - returned - paid}
                      records={invoice.returns.map((item) => ({ ...item, text: item.reason }))}
                      onAdd={({ text, ...rest }) =>
                        addReturn.mutateAsync({ id: invoice.id, input: { ...rest, reason: text } })
                      }
                      onRemove={(returnId) => removeReturn.mutateAsync({ id: invoice.id, returnId })}
                    />
                    <InvoiceDialog invoice={invoice} />
                    <DeleteButton
                      itemLabel={`invoice ${invoice.number}`}
                      onDelete={() => deleteInvoice.mutateAsync(invoice.id)}
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
