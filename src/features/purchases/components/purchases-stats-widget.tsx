"use client"

import { StatList } from "@/components/dashboard/stat-list"
import { WidgetCard } from "@/components/dashboard/widget-card"

import { usePurchaseItems } from "../hooks"

export function PurchasesStatsWidget() {
  const query = usePurchaseItems()
  const items = query.data ?? []

  return (
    <WidgetCard
      title="Purchases"
      description="Statistics"
      query={query}
      isEmpty={items.length === 0}
      emptyMessage="Nothing on your list."
    >
      <StatList
        items={[
          { label: "Items to buy", value: String(items.length) },
          { label: "With a link", value: String(items.filter((item) => item.url).length) },
          { label: "Without a link", value: String(items.filter((item) => !item.url).length) },
        ]}
      />
    </WidgetCard>
  )
}
