"use client"

import { StatList } from "@/components/dashboard/stat-list"
import { WidgetCard } from "@/components/dashboard/widget-card"

import { useTickets } from "../hooks"

export function HelpDeskStatsWidget() {
  const query = useTickets()
  const tickets = query.data ?? []
  const count = (predicate: (ticket: (typeof tickets)[number]) => boolean) =>
    String(tickets.filter(predicate).length)

  return (
    <WidgetCard
      title="Help desk"
      description="Statistics"
      query={query}
      isEmpty={tickets.length === 0}
      emptyMessage="No tickets yet."
    >
      <StatList
        items={[
          { label: "Total tickets", value: String(tickets.length) },
          { label: "Open", value: count((ticket) => ticket.status === "open") },
          { label: "In progress", value: count((ticket) => ticket.status === "in-progress") },
          { label: "Resolved", value: count((ticket) => ticket.status === "resolved") },
          {
            label: "High priority, unresolved",
            value: count((ticket) => ticket.priority === "high" && ticket.status !== "resolved"),
          },
        ]}
      />
    </WidgetCard>
  )
}
