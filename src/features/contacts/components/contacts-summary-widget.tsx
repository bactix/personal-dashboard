"use client"

import Link from "next/link"

import { WidgetCard } from "@/components/dashboard/widget-card"

import { useContacts } from "../hooks"

export function ContactsSummaryWidget() {
  const query = useContacts()
  const count = query.data?.length ?? 0

  return (
    <WidgetCard
      title="Contacts"
      description="People you track"
      query={query}
      isEmpty={count === 0}
      emptyMessage="No contacts yet."
    >
      <div className="flex flex-col gap-3">
        <p className="text-3xl font-semibold tabular-nums">{count}</p>
        <Link
          href="/personal/contacts"
          className="w-fit text-sm text-primary underline-offset-4 hover:underline"
        >
          View contacts
        </Link>
      </div>
    </WidgetCard>
  )
}
