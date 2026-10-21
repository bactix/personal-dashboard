"use client"

import Link from "next/link"

import { WidgetCard } from "@/components/dashboard/widget-card"

import { usePurchaseItems } from "../hooks"

const PREVIEW_COUNT = 3

export function PurchasesSummaryWidget() {
  const query = usePurchaseItems()
  const items = query.data ?? []

  return (
    <WidgetCard
      title="To buy"
      description={query.data ? `${items.length} on your list` : undefined}
      query={query}
      isEmpty={items.length === 0}
      emptyMessage="Nothing on your list."
    >
      <div className="flex flex-col gap-3">
        <ul className="flex flex-col gap-1 text-sm">
          {items.slice(0, PREVIEW_COUNT).map((item) => (
            <li key={item.id} className="truncate">
              {item.name}
            </li>
          ))}
        </ul>
        <Link
          href="/personal/purchase"
          className="w-fit text-sm text-primary underline-offset-4 hover:underline"
        >
          View list
        </Link>
      </div>
    </WidgetCard>
  )
}
