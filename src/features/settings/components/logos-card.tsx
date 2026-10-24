"use client"

import Image from "next/image"

import { CreatedDate } from "@/components/dashboard/created-date"
import { DeleteButton } from "@/components/dashboard/delete-button"
import { ListPagination } from "@/components/dashboard/list-pagination"
import { WidgetCard } from "@/components/dashboard/widget-card"
import { usePagination } from "@/hooks/use-pagination"

import { useDeleteLogo, useLogos } from "../logo-hooks"
import { LogoDialog } from "./logo-dialog"

export function LogosCard() {
  const query = useLogos()
  const deleteLogo = useDeleteLogo()
  const pagination = usePagination(query.data ?? [])

  return (
    <WidgetCard
      title="Logos"
      description={query.data ? `${query.data.length} saved` : "Named logo images"}
      query={query}
      action={<LogoDialog />}
      bare
      isEmpty={query.data?.length === 0}
      emptyMessage="No logos yet. Use Add logo to upload one."
    >
      <ul className="divide-y">
        {pagination.pageItems.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-2 py-2 text-sm">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-muted/40 p-1">
                <Image
                  src={item.image}
                  alt={`${item.name} logo`}
                  width={40}
                  height={40}
                  unoptimized
                  className="max-h-full w-auto object-contain"
                />
              </div>
              <div className="min-w-0">
                <span className="block font-medium wrap-break-word">{item.name}</span>
                <CreatedDate iso={item.createdAt} />
              </div>
            </div>
            <div className="flex shrink-0 items-center">
              <LogoDialog logo={item} />
              <DeleteButton
                itemLabel={`logo “${item.name}”`}
                onDelete={() => deleteLogo.mutateAsync(item.id)}
              />
            </div>
          </li>
        ))}
      </ul>
      <ListPagination pagination={pagination} />
    </WidgetCard>
  )
}
