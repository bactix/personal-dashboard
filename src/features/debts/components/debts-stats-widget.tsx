"use client"

import { StatList } from "@/components/dashboard/stat-list"
import { WidgetCard } from "@/components/dashboard/widget-card"

import { useDebts } from "../hooks"
import { totalsFor } from "../totals"

/** Local calendar date as yyyy-mm-dd, to compare against stored due dates. */
function today() {
  return new Date().toLocaleDateString("en-CA")
}

export function DebtsStatsWidget() {
  const query = useDebts()
  const debts = query.data ?? []

  const dated = debts.filter((debt) => debt.dueDate).sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))
  const overdue = dated.filter((debt) => debt.dueDate! < today())
  const nextDue = dated.find((debt) => debt.dueDate! >= today())

  return (
    <WidgetCard
      title="Debts"
      description="Statistics"
      query={query}
      isEmpty={debts.length === 0}
      emptyMessage="No debts recorded."
    >
      <StatList
        items={[
          { label: "Total debts", value: String(debts.length) },
          { label: "You owe", value: totalsFor(debts, "i-owe") },
          { label: "Owed to you", value: totalsFor(debts, "owed-to-me") },
          { label: "Overdue", value: String(overdue.length) },
          { label: "Next due", value: nextDue?.dueDate ?? "—" },
        ]}
      />
    </WidgetCard>
  )
}
