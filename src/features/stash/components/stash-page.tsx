"use client"

import { ExternalLinkIcon } from "lucide-react"
import { useState } from "react"

import { CreatedDate } from "@/components/dashboard/created-date"
import { DeleteButton } from "@/components/dashboard/delete-button"
import { ListPagination } from "@/components/dashboard/list-pagination"
import { WidgetCard } from "@/components/dashboard/widget-card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePagination } from "@/hooks/use-pagination"

import { useDeleteStashItem, useStash, useUpdateStashItem } from "../hooks"
import { isHttpUrl, STASH_STATUSES, type StashItem, type StashStatus } from "../types"
import { StashDialog } from "./stash-dialog"

type Filter = "all" | StashStatus

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

export function StashPage() {
  const query = useStash()
  const deleteItem = useDeleteStashItem()
  const updateItem = useUpdateStashItem()
  const [filter, setFilter] = useState<Filter>("all")

  const items = query.data ?? []
  const visible = filter === "all" ? items : items.filter((item) => item.status === filter)
  const pagination = usePagination(visible)
  const countOf = (status: StashStatus) => items.filter((item) => item.status === status).length

  function changeStatus(item: StashItem, status: StashStatus) {
    updateItem.mutate({ id: item.id, input: { title: item.title, content: item.content, status } })
  }

  return (
    <div className="px-4 lg:px-6">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <WidgetCard
          title="Stash"
          description={query.data ? `${items.length} stashed for later` : undefined}
          query={query}
          action={<StashDialog />}
          isEmpty={items.length === 0}
          emptyMessage="Nothing stashed yet. Use Stash something to keep a link or some text."
        >
          <div className="flex flex-col gap-3">
            <Tabs
              value={filter}
              onValueChange={(value) => {
                setFilter(value as Filter)
                pagination.setPage(1)
              }}
            >
              <TabsList className="max-w-full overflow-x-auto">
                <TabsTrigger value="all">All ({items.length})</TabsTrigger>
                {STASH_STATUSES.map((status) => (
                  <TabsTrigger key={status.value} value={status.value}>
                    {status.label} ({countOf(status.value)})
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {visible.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing with this status.</p>
            ) : (
              <ul className="divide-y">
                {pagination.pageItems.map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-2 py-3 text-sm">
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="font-medium wrap-break-word">{item.title}</span>
                      {isHttpUrl(item.content) ? (
                        <a
                          href={item.content}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex w-fit max-w-full items-center gap-1 text-primary underline-offset-4 hover:underline"
                        >
                          <span className="truncate">{hostname(item.content)}</span>
                          <ExternalLinkIcon className="size-3.5 shrink-0" aria-hidden />
                          <span className="sr-only">(opens in a new tab)</span>
                        </a>
                      ) : (
                        <p className="line-clamp-3 whitespace-pre-line text-muted-foreground wrap-break-word">
                          {item.content}
                        </p>
                      )}
                      <CreatedDate iso={item.createdAt} />
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Select
                        value={item.status}
                        onValueChange={(value) => changeStatus(item, value as StashStatus)}
                      >
                        <SelectTrigger size="sm" className="w-32" aria-label={`Status of ${item.title}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STASH_STATUSES.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <StashDialog item={item} />
                      <DeleteButton
                        itemLabel={`stash item “${item.title}”`}
                        onDelete={() => deleteItem.mutateAsync(item.id)}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <ListPagination pagination={pagination} />
          </div>
        </WidgetCard>
      </div>
    </div>
  )
}
