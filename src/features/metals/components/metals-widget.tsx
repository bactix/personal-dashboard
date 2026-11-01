"use client"

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import { WidgetCard } from "@/components/dashboard/widget-card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

import { useMetalHistory, useMetalPrices } from "../hooks"
import type { MetalHistory, MetalPrices } from "../types"

const SERIES = ["gold", "silver", "bitcoin"] as const
type SeriesKey = (typeof SERIES)[number]

const chartConfig = {
  gold: { label: "Gold", color: "var(--chart-1)" },
  silver: { label: "Silver", color: "var(--chart-2)" },
  bitcoin: { label: "Bitcoin", color: "var(--chart-3)" },
} satisfies ChartConfig

const usd = new Intl.NumberFormat("en", { style: "currency", currency: "USD" })
const dayFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" })
const timeFormat = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" })

/** The live price of each series, shown above the chart. */
function currentPrices(prices: MetalPrices) {
  const { gold, silver, goldLira, bitcoin } = prices
  return [
    { id: "gold", ...chartConfig.gold, price: gold.perOunce, note: `per ounce · ${usd.format(gold.perGram)} / g` },
    { id: "silver", ...chartConfig.silver, price: silver.perOunce, note: `per ounce · ${usd.format(silver.perGram)} / g` },
    // Priced from the gold price, so it has no line of its own on the chart.
    { id: "lira", label: "Gold lira", color: chartConfig.gold.color, price: goldLira.perCoin, note: `${goldLira.grams} g · ${goldLira.karat}K coin` },
    ...(bitcoin ? [{ id: "bitcoin", ...chartConfig.bitcoin, price: bitcoin.perCoin, note: "per coin" }] : []),
  ]
}

/** Percent change per series (the plotted line) plus its price, which the tooltip shows. */
type ChartRow = { date: string } & Partial<Record<SeriesKey | `${SeriesKey}Price`, number>>

/** Percent change since each series' first price, so gold, silver and Bitcoin share one axis. */
function toChartRows(points: MetalHistory["points"]): ChartRow[] {
  const start: Partial<Record<SeriesKey, number>> = {}
  for (const point of points) {
    for (const key of SERIES) {
      const price = point[key]
      if (price !== undefined && start[key] === undefined) start[key] = price
    }
  }
  return points.map((point) => {
    const row: ChartRow = { date: point.date }
    for (const key of SERIES) {
      const price = point[key]
      const base = start[key]
      if (price !== undefined && base !== undefined) {
        row[key] = ((price - base) / base) * 100
        row[`${key}Price`] = price
      }
    }
    return row
  })
}

export function MetalsWidget() {
  const query = useMetalHistory()
  const rows = query.data ? toChartRows(query.data.points) : []
  // The live prices are a bonus: if only they fail to load, the chart still shows.
  const prices = useMetalPrices().data

  return (
    <WidgetCard
      title="Gold, silver & Bitcoin"
      description={
        prices
          ? `Live prices, updated ${timeFormat.format(new Date(prices.updatedAt))} · USD`
          : "Change over the last month · USD"
      }
      query={query}
      isEmpty={query.data?.points.length === 0}
      emptyMessage="No price history available."
    >
      {prices && (
        <ul className="mb-4 grid grid-cols-2 gap-x-2 gap-y-3 sm:grid-cols-4">
          {currentPrices(prices).map(({ id, label, color, price, note }) => (
            <li key={id} className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="size-2 shrink-0 rounded-xs" style={{ backgroundColor: color }} />
                {label}
              </div>
              <p className="truncate text-lg font-semibold tabular-nums sm:text-xl">{usd.format(price)}</p>
              <p className="truncate text-xs text-muted-foreground">{note}</p>
            </li>
          ))}
        </ul>
      )}
      <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
        <LineChart data={rows}>
          <CartesianGrid vertical={false} />
          {/* Hidden: the tooltip gives the values, and "auto" keeps negative changes visible. */}
          <YAxis hide domain={["auto", "auto"]} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={32}
            tickFormatter={(value: string) => dayFormat.format(new Date(value))}
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                labelFormatter={(value) => dayFormat.format(new Date(value))}
                formatter={(value, name, item) => {
                  const key = name as SeriesKey
                  const change = Number(value)
                  const price = (item.payload as ChartRow | undefined)?.[`${key}Price`]
                  return (
                    <>
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-xs"
                        style={{ backgroundColor: `var(--color-${key})` }}
                      />
                      <div className="flex flex-1 items-center justify-between gap-4 leading-none">
                        <span className="text-muted-foreground">{chartConfig[key].label}</span>
                        <span className="font-mono font-medium text-foreground tabular-nums">
                          {price !== undefined && `${usd.format(price)} `}
                          <span className="text-muted-foreground">
                            ({change >= 0 ? "+" : ""}
                            {change.toFixed(1)}%)
                          </span>
                        </span>
                      </div>
                    </>
                  )
                }}
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          {SERIES.map((key) => (
            <Line
              key={key}
              dataKey={key}
              type="monotone"
              stroke={`var(--color-${key})`}
              strokeWidth={2}
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ChartContainer>
    </WidgetCard>
  )
}
