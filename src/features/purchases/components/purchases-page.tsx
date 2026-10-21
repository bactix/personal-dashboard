"use client"

import { ExternalLinkIcon } from "lucide-react"

import { DeleteButton } from "@/components/dashboard/delete-button"
import { ListPagination } from "@/components/dashboard/list-pagination"
import { WidgetCard } from "@/components/dashboard/widget-card"
import { usePagination } from "@/hooks/use-pagination"

import { useDeletePurchaseItem, usePurchaseItems } from "../hooks"
import { PurchaseItemDialog } from "./purchase-item-dialog"

function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

export function PurchasesPage() {
  const query = usePurchaseItems()
  const deleteItem = useDeletePurchaseItem()
  const pagination = usePagination(query.data ?? [])

  return (
    <div className="px-4 lg:px-6">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <WidgetCard
          title="To buy later"
          description={query.data ? `${query.data.length} items` : undefined}
          query={query}
          action={<PurchaseItemDialog />}
          isEmpty={query.data?.length === 0}
          emptyMessage="Nothing on your list yet. Use Add item to create one."
        >
          <ul className="divide-y">
            {pagination.pageItems.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-2 py-3 text-sm">
              <div className="flex min-w-0 flex-col gap-1">
                <span className="font-medium break-words">{item.name}</span>
                {item.note && <span className="text-muted-foreground break-words">{item.note}</span>}
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-fit max-w-full items-center gap-1 text-primary underline-offset-4 hover:underline"
                  >
                    <span className="truncate">{hostname(item.url)}</span>
                    <ExternalLinkIcon className="size-3.5 shrink-0" aria-hidden />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                )}
              </div>
              <div className="flex shrink-0 items-center">
                <PurchaseItemDialog item={item} />
                <DeleteButton
                  itemLabel={`item “${item.name}”`}
                  onDelete={() => deleteItem.mutateAsync(item.id)}
                />
              </div>
              </li>
            ))}
          </ul>
          <ListPagination pagination={pagination} />
        </WidgetCard>
      </div>
    </div>
  )
}
