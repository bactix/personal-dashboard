"use client"

import Link from "next/link"

import { WidgetCard } from "@/components/dashboard/widget-card"

import { useDebts } from "../hooks"
import { totalsFor } from "../totals"

export function DebtsSummaryWidget() {
  const query = useDebts()
  const debts = query.data ?? []

  return (
    <WidgetCard
      title="Debts"
      description="Where you stand"
      query={query}
      isEmpty={debts.length === 0}
      emptyMessage="No debts recorded."
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 @md/card:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">You owe</p>
            <p className="text-2xl font-semibold tabular-nums">{totalsFor(debts, "i-owe")}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Owed to you</p>
            <p className="text-2xl font-semibold tabular-nums">
              {totalsFor(debts, "owed-to-me")}
            </p>
          </div>
        </div>
        <Link
          href="/financial/debts"
          className="w-fit text-sm text-primary underline-offset-4 hover:underline"
        >
          View debts
        </Link>
      </div>
    </WidgetCard>
  )
}
