"use client"

import { CreatedDate } from "@/components/dashboard/created-date"
import { DeleteButton } from "@/components/dashboard/delete-button"
import { ListPagination } from "@/components/dashboard/list-pagination"
import { WidgetCard } from "@/components/dashboard/widget-card"
import { RateCalculator, useExchangeRates, usdPer } from "@/features/exchange-rates"
import { usePagination } from "@/hooks/use-pagination"

import { useCurrencies, useDeleteCurrency } from "../currency-hooks"
import { CurrencyDialog } from "./currency-dialog"

const names = new Intl.DisplayNames("en", { type: "currency" })

function currencyName(code: string): string {
  try {
    return names.of(code) ?? code
  } catch {
    return code
  }
}

export function CurrenciesCard() {
  const query = useCurrencies()
  const deleteCurrency = useDeleteCurrency()
  const rates = useExchangeRates().data
  const pagination = usePagination(query.data ?? [])

  return (
    <WidgetCard
      title="Currencies"
      description="Currencies available for money amounts"
      query={query}
      action={<CurrencyDialog />}
      bare
      isEmpty={query.data?.length === 0}
      emptyMessage="No currencies yet. Use Add currency to create one."
    >
      <ul className="divide-y">
        {pagination.pageItems.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-2 py-3 text-sm">
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="font-medium">{item.code}</span>
              <span className="text-muted-foreground wrap-break-word">{currencyName(item.code)}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {item.code === "USD"
                  ? "Base currency"
                  : usdPer(rates, item.code) !== undefined
                    ? `1 ${item.code} = ${usdPer(rates, item.code)!.toFixed(4)} USD`
                    : "No live rate"}
              </span>
              <CreatedDate iso={item.createdAt} />
              {item.code !== "USD" && rates?.perUsd[item.code] !== undefined && (
                <div className="mt-2 w-full max-w-72">
                  <RateCalculator code={item.code} perUsd={rates.perUsd[item.code]} />
                </div>
              )}
            </div>
            <div className="flex shrink-0 items-center">
              <CurrencyDialog currency={item} />
              <DeleteButton
                itemLabel={`currency ${item.code}`}
                onDelete={() => deleteCurrency.mutateAsync(item.id)}
              />
            </div>
          </li>
        ))}
      </ul>
      <ListPagination pagination={pagination} />
    </WidgetCard>
  )
}
