"use client"

import { StatList } from "@/components/dashboard/stat-list"
import { combineQueries, WidgetCard } from "@/components/dashboard/widget-card"
import { useToday } from "@/hooks/use-today"
import { CURRENCIES, formatMoney } from "@/lib/money"

import { useBills, useInvoices } from "../hooks"
import { billTotalCents, invoiceTotalCents } from "../totals"

export function PaymentsStatsWidget() {
  const invoicesQuery = useInvoices()
  const billsQuery = useBills()
  const query = combineQueries(invoicesQuery, billsQuery)
  const today = useToday()

  const invoices = invoicesQuery.data ?? []
  const bills = billsQuery.data ?? []

  // Receivable = sent but unpaid; payable = unpaid. Drafts are not counted yet.
  const receivable = invoices.filter((invoice) => invoice.status === "sent")
  const payable = bills.filter((bill) => bill.status === "unpaid")

  const overdueInvoices = today ? receivable.filter((invoice) => invoice.dueDate < today).length : null
  const overdueBills = today ? payable.filter((bill) => bill.dueDate < today).length : null

  const owedToYou = CURRENCIES.flatMap((currency) => {
    const open = receivable.filter((invoice) => invoice.currency === currency)
    if (open.length === 0) return []
    const total = open.reduce((sum, invoice) => sum + invoiceTotalCents(invoice), 0)
    return [{ label: `Owed to you (${currency})`, value: formatMoney(total, currency) }]
  })
  const youOwe = CURRENCIES.flatMap((currency) => {
    const open = payable.filter((bill) => bill.currency === currency)
    if (open.length === 0) return []
    const total = open.reduce((sum, bill) => sum + billTotalCents(bill), 0)
    return [{ label: `You owe (${currency})`, value: formatMoney(total, currency) }]
  })

  return (
    <WidgetCard
      title="Payments"
      description="Statistics"
      query={query}
      isEmpty={invoices.length === 0 && bills.length === 0}
      emptyMessage="No invoices or vendor bills yet."
    >
      <StatList
        items={[
          { label: "Invoices", value: String(invoices.length) },
          { label: "Unpaid invoices", value: String(receivable.length) },
          ...owedToYou,
          { label: "Overdue invoices", value: overdueInvoices === null ? "…" : String(overdueInvoices) },
          { label: "Vendor bills", value: String(bills.length) },
          { label: "Unpaid bills", value: String(payable.length) },
          ...youOwe,
          { label: "Overdue bills", value: overdueBills === null ? "…" : String(overdueBills) },
        ]}
      />
    </WidgetCard>
  )
}
