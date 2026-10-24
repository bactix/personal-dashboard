"use client"

import { WidgetCard } from "@/components/dashboard/widget-card"

import { useMetalPrices } from "../hooks"
import type { MetalPrices } from "../types"

const usd = new Intl.NumberFormat("en", { style: "currency", currency: "USD" })

const timeFormat = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" })

const METALS: { key: keyof Pick<MetalPrices, "gold" | "silver">; label: string }[] = [
  { key: "gold", label: "Gold" },
  { key: "silver", label: "Silver" },
]

export function MetalsWidget() {
  const query = useMetalPrices()
  const data = query.data

  return (
    <WidgetCard
      title="Gold, silver & Bitcoin"
      description={data ? `Updated ${timeFormat.format(new Date(data.updatedAt))} · USD` : "Live prices · USD"}
      query={query}
    >
      {data && (
        <ul className="divide-y">
          {METALS.map(({ key, label }) => (
            <li key={key} className="flex items-center justify-between gap-3 py-3">
              <div className="flex flex-col">
                <span className="font-medium">{label}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {usd.format(data[key].perGram)} / gram
                </span>
              </div>
              <div className="text-right">
                <p className="text-xl font-semibold tabular-nums">{usd.format(data[key].perOunce)}</p>
                <p className="text-xs text-muted-foreground">per ounce</p>
              </div>
            </li>
          ))}
          {data.bitcoin && (
            <li className="flex items-center justify-between gap-3 py-3">
              <span className="font-medium">Bitcoin</span>
              <div className="text-right">
                <p className="text-xl font-semibold tabular-nums">{usd.format(data.bitcoin.perCoin)}</p>
                <p className="text-xs text-muted-foreground">per coin</p>
              </div>
            </li>
          )}
        </ul>
      )}
    </WidgetCard>
  )
}
