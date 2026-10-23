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

import { useDeleteInvoice, useInvoices } from "../hooks"
import { invoiceHtml } from "../print"
import { invoiceTotalCents, paymentStatus } from "../totals"
import { InvoiceDialog } from "./invoice-dialog"
import { PrintButton } from "./print-button"

export function InvoicesList() {
  const query = useInvoices()
  const deleteInvoice = useDeleteInvoice()
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
            <TableHead className="w-28">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagination.pageItems.map((invoice) => {
            const status = paymentStatus(invoice, today)
            return (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium tabular-nums">{invoice.number}</TableCell>
                <TableCell className="whitespace-normal break-words">{invoice.customer}</TableCell>
                <TableCell className="tabular-nums">{invoice.dueDate}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(invoiceTotalCents(invoice), invoice.currency)}
                </TableCell>
                <TableCell>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end">
                    <PrintButton
                      itemLabel={`invoice ${invoice.number}`}
                      onPrint={() => printHtml(invoiceHtml(invoice))}
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
