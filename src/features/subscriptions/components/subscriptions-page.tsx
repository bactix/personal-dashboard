"use client"

import { DeleteButton } from "@/components/dashboard/delete-button"
import { ListPagination } from "@/components/dashboard/list-pagination"
import { WidgetCard } from "@/components/dashboard/widget-card"
import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { usePagination } from "@/hooks/use-pagination"
import { useToday } from "@/hooks/use-today"
import { formatCreatedDate } from "@/lib/dates"
import { CURRENCIES, formatMoney } from "@/lib/money"

import { useDeleteSubscription, useSubscriptionPayments, useSubscriptions } from "../hooks"
import { daysBetween, monthlyCents, nextRenewal, yearlyCents } from "../renewal"
import {
  cycleLabel,
  isLatePayment,
  statusLabel,
  type Subscription,
  type SubscriptionStatus,
} from "../types"
import { PaySubscriptionDialog } from "./pay-subscription-dialog"
import { SubscriptionDialog } from "./subscription-dialog"

const STATUS_VARIANT: Record<SubscriptionStatus, "default" | "secondary" | "outline"> = {
  active: "default",
  paused: "secondary",
  cancelled: "outline",
}

const STATUS_ORDER: Record<SubscriptionStatus, number> = { active: 0, paused: 1, cancelled: 2 }

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums">{value}</CardTitle>
      </CardHeader>
    </Card>
  )
}

/** "today", "tomorrow" or "in 12 days". */
function inDays(days: number): string {
  if (days === 0) return "today"
  return days === 1 ? "tomorrow" : `in ${days} days`
}

/** Totals per currency over the active subscriptions (currencies are never added together). */
function costSummary(active: Subscription[], cost: (s: Subscription) => number): string {
  const parts = CURRENCIES.flatMap((currency) => {
    const mine = active.filter((subscription) => subscription.currency === currency)
    if (mine.length === 0) return []
    return [formatMoney(mine.reduce((sum, subscription) => sum + cost(subscription), 0), currency)]
  })
  return parts.length > 0 ? parts.join(" · ") : "—"
}

export function SubscriptionsPage() {
  const query = useSubscriptions()
  const deleteSubscription = useDeleteSubscription()
  const paymentList = useSubscriptionPayments().data ?? []
  // null until the browser knows today's date: renewal dates need it.
  const today = useToday()

  const renewalOf = (subscription: Subscription) =>
    today && subscription.status === "active"
      ? nextRenewal(subscription.startDate, subscription.cycle, today)
      : null

  // Active first (soonest renewal on top), then paused, then cancelled.
  const subscriptions = [...(query.data ?? [])].sort((a, b) => {
    const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    if (byStatus !== 0) return byStatus
    return (renewalOf(a) ?? "").localeCompare(renewalOf(b) ?? "") || a.name.localeCompare(b.name)
  })
  const pagination = usePagination(subscriptions)
  const active = subscriptions.filter((subscription) => subscription.status === "active")

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SummaryCard label="Per month (active)" value={costSummary(active, monthlyCents)} />
        <SummaryCard label="Per year (active)" value={costSummary(active, yearlyCents)} />
      </div>

      <WidgetCard
        title="Subscriptions"
        description={query.data ? `${active.length} active of ${subscriptions.length}` : undefined}
        query={query}
        action={<SubscriptionDialog />}
        isEmpty={subscriptions.length === 0}
        emptyMessage="No subscriptions yet. Use Add subscription to track one."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Billed</TableHead>
              <TableHead>Next renewal</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-48">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagination.pageItems.map((subscription) => {
              const renewal = renewalOf(subscription)
              // Paid for the upcoming renewal, otherwise show the latest payment (payments are newest first).
              const currentPayment = paymentList.find(
                (payment) => payment.subscriptionId === subscription.id && payment.dueDate === renewal
              )
              const shown =
                currentPayment ?? paymentList.find((payment) => payment.subscriptionId === subscription.id)
              return (
                <TableRow key={subscription.id}>
                  <TableCell className="whitespace-normal">
                    <span className="font-medium wrap-break-word">{subscription.name}</span>
                    {subscription.notes && (
                      <p className="mt-0.5 line-clamp-2 text-xs whitespace-pre-line text-muted-foreground">
                        {subscription.notes}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap tabular-nums">
                    {formatMoney(subscription.amountCents, subscription.currency)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{cycleLabel(subscription.cycle)}</TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {renewal && today ? (
                      <>
                        {renewal}
                        <span className="block text-xs text-muted-foreground">
                          {inDays(daysBetween(today, renewal))}
                        </span>
                      </>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {shown ? (
                      <>
                        <Badge variant={isLatePayment(shown) ? "destructive" : "secondary"}>
                          {isLatePayment(shown) ? "Paid late" : "Paid on time"}
                        </Badge>
                        <span className="block text-xs text-muted-foreground">
                          {shown.paidDate} · due {shown.dueDate}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[subscription.status]}>{statusLabel(subscription.status)}</Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">
                    {formatCreatedDate(subscription.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {renewal && !currentPayment && (
                        <>
                          <PaySubscriptionDialog subscription={subscription} dueDate={renewal} mode="pay" />
                          <PaySubscriptionDialog subscription={subscription} dueDate={renewal} mode="direct" />
                        </>
                      )}
                      <SubscriptionDialog subscription={subscription} />
                      <DeleteButton
                        itemLabel={`subscription “${subscription.name}”`}
                        onDelete={() => deleteSubscription.mutateAsync(subscription.id)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        <ListPagination pagination={pagination} />
      </WidgetCard>
    </div>
  )
}
