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
          <ul className="grid grid-cols-1 gap-x-6 gap-y-6 @md/card:grid-cols-2 @3xl/card:grid-cols-3">
            {SHOWN.map((code) => {
              const usd = usdPer(data, code)
              const perUsd = data.perUsd[code]
              if (usd === undefined || perUsd === undefined) return null
              return (
                <li key={code} className="flex flex-col gap-2">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm text-muted-foreground">
                      {code} · {nameOf(code)}
                    </span>
                    <span className="text-2xl font-semibold tabular-nums">
                      1 {code} = {usd.toFixed(4)} USD
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      1 USD = {perUsd.toFixed(4)} {code}
                    </span>
                  </div>
                  <RateCalculator code={code} perUsd={perUsd} />
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
