"use client"

import Link from "next/link"

import { WidgetCard } from "@/components/dashboard/widget-card"
import { Badge } from "@/components/ui/badge"
import { useContacts } from "@/features/contacts"
import { formatMoney } from "@/lib/money"

import { useDebts } from "../hooks"
import { remainingCents, totalsFor } from "../totals"

/** How many of the newest debts the tile lists; the rest are on the Debts page. */
const RECENT_COUNT = 5

export function DebtsSummaryWidget() {
  const query = useDebts()
  const contacts = useContacts()
  const debts = query.data ?? []
  // The API returns debts newest first, so the first few are the latest.
  const open = debts.filter((debt) => remainingCents(debt) > 0)
  const recent = open.slice(0, RECENT_COUNT)
  const nameById = new Map(contacts.data?.map((contact) => [contact.id, contact.name]))

  return (
    <WidgetCard
      title="Debts"
      description={query.data ? `${debts.length} recorded` : "Where you stand"}
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

        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">Latest {recent.length}</p>
          <ul className="divide-y text-sm">
            {recent.map((debt) => (
              <li key={debt.id} className="flex items-center justify-between gap-2 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <Badge variant={debt.direction === "i-owe" ? "destructive" : "secondary"}>
                    {debt.direction === "i-owe" ? "I owe" : "Owes me"}
                  </Badge>
                  <span className="truncate font-medium">
                    {nameById.get(debt.contactId) ?? "Unknown contact"}
                  </span>
                </div>
                <span className="shrink-0 tabular-nums">
                  {formatMoney(remainingCents(debt), debt.currency)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <Link
          href="/financial/debts"
          className="w-fit text-sm text-primary underline-offset-4 hover:underline"
        >
          {open.length > RECENT_COUNT ? `View all ${open.length} open debts` : "View debts"}
        </Link>
      </div>
    </WidgetCard>
  )
}
