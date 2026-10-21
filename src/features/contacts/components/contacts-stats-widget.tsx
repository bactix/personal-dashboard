"use client"

import { StatList } from "@/components/dashboard/stat-list"
import { WidgetCard } from "@/components/dashboard/widget-card"

import { useContacts } from "../hooks"

export function ContactsStatsWidget() {
  const query = useContacts()
  const count = query.data?.length ?? 0

  return (
    <WidgetCard
      title="Contacts"
      description="Statistics"
      query={query}
      isEmpty={count === 0}
      emptyMessage="No contacts yet."
    >
      <StatList items={[{ label: "Total contacts", value: String(count) }]} />
    </WidgetCard>
  )
}
