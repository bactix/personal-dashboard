"use client"

import { StatList } from "@/components/dashboard/stat-list"
import { WidgetCard } from "@/components/dashboard/widget-card"
import { CURRENCIES, formatMoney } from "@/lib/money"

import { useAssets } from "../hooks"

export function AssetsStatsWidget() {
  const query = useAssets()
  const assets = query.data ?? []

  const perCurrency = CURRENCIES.flatMap((currency) => {
    const owned = assets.filter((asset) => asset.currency === currency)
    if (owned.length === 0) return []
    const paid = owned.reduce((sum, asset) => sum + asset.purchaseCents, 0)
    const worth = owned.reduce((sum, asset) => sum + asset.currentValueCents, 0)
    const change = worth - paid
    return [
      { label: `Paid (${currency})`, value: formatMoney(paid, currency) },
      { label: `Worth now (${currency})`, value: formatMoney(worth, currency) },
      {
        label: `Gain / loss (${currency})`,
        value: `${change > 0 ? "+" : change < 0 ? "−" : ""}${formatMoney(Math.abs(change), currency)}`,
      },
    ]
  })

  return (
    <WidgetCard
      title="Assets"
      description="Statistics"
      query={query}
      isEmpty={assets.length === 0}
      emptyMessage="No assets yet."
    >
      <StatList items={[{ label: "Total assets", value: String(assets.length) }, ...perCurrency]} />
    </WidgetCard>
  )
}
