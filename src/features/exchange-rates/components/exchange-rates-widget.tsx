"use client"

import { WidgetCard } from "@/components/dashboard/widget-card"

import { useExchangeRates } from "../hooks"
import { usdPer } from "../types"
import { RateCalculator } from "./rate-calculator"

/** The currencies shown against the US dollar. */
const SHOWN = ["EUR", "CAD", "AUD", "AED", "SAR"] as const

const names = new Intl.DisplayNames("en", { type: "currency" })
const nameOf = (code: string) => names.of(code) ?? code

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "long", year: "numeric" })

export function ExchangeRatesWidget() {
  const query = useExchangeRates()
  const data = query.data

  return (
    <WidgetCard
      title="Exchange rates"
      description={
        data
          ? `Against the US dollar · updated ${dateFormat.format(new Date(`${data.date}T12:00:00`))}`
          : "Against the US dollar"
      }
      query={query}
    >
      {data && (
        <div className="flex flex-col gap-4">
          <ul className="flex flex-col gap-3">
            {SHOWN.map((code) => {
              const usd = usdPer(data, code)
              const perUsd = data.perUsd[code]
              if (usd === undefined || perUsd === undefined) return null
              return (
                <li key={code} className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-xs text-muted-foreground" title={nameOf(code)}>
                      {code} · {nameOf(code)}
                    </span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">
                      {usd.toFixed(4)} USD
                    </span>
                  </div>
                  <RateCalculator code={code} perUsd={perUsd} compact />
                </li>
              )
            })}
          </ul>
          <p className="text-xs text-muted-foreground">
            Rates by{" "}
            <a
              href="https://www.exchangerate-api.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4"
            >
              Exchange Rate API
            </a>
            . Market rates, for reference only.
          </p>
        </div>
      )}
    </WidgetCard>
  )
}
