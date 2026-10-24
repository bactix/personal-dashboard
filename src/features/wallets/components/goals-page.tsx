"use client"

import { CreatedDate } from "@/components/dashboard/created-date"
import { DeleteButton } from "@/components/dashboard/delete-button"
import { ListPagination } from "@/components/dashboard/list-pagination"
import { WidgetCard } from "@/components/dashboard/widget-card"
import { Progress } from "@/components/ui/progress"
import { usePagination } from "@/hooks/use-pagination"
import { useToday } from "@/hooks/use-today"
import { formatMoney } from "@/lib/money"
import { cn } from "@/lib/utils"

import { computeBalances } from "../balances"
import { useDeleteGoal, useGoals, useTransactions, useWallets } from "../hooks"
import { GoalDialog } from "./goal-dialog"
import { TransactionDialog } from "./transaction-dialog"

export function GoalsPage() {
  const query = useGoals()
  const deleteGoal = useDeleteGoal()
  const transactions = useTransactions()
  const wallets = useWallets()
  const today = useToday()
  const goals = query.data ?? []
  const pagination = usePagination(goals)
  const balances = computeBalances(transactions.data ?? [], wallets.data ?? [])

  return (
    <div className="px-4 lg:px-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <WidgetCard
          title="Goals"
          description={query.data ? `${goals.length} total` : undefined}
          query={query}
          action={<GoalDialog />}
          isEmpty={goals.length === 0}
          emptyMessage="No goals yet. Use Add goal to start saving for something. Each goal gets its own wallet; add or take out money right on the goal."
        >
          <ul className="divide-y">
            {pagination.pageItems.map((goal) => {
              const saved = Math.max(0, balances.get(goal.walletId) ?? 0)
              const percent = Math.min(100, Math.floor((saved / goal.targetCents) * 100))
              return (
                <li key={goal.id} className="flex flex-col gap-2 py-3 first:pt-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium break-words">{goal.name}</p>
                      <CreatedDate iso={goal.createdAt} />
                    </div>
                    <div className="flex shrink-0 items-center">
                      <GoalDialog goal={goal} />
                      <DeleteButton
                        itemLabel={`goal “${goal.name}”`}
                        onDelete={() => deleteGoal.mutateAsync(goal.id)}
                      />
                    </div>
                  </div>
                  <Progress value={percent} aria-label={`${goal.name} progress`} />
                  <div className="flex flex-wrap gap-2">
                    <TransactionDialog kind="deposit" fixedWalletId={goal.walletId} />
                    <TransactionDialog kind="withdrawal" fixedWalletId={goal.walletId} />
                  </div>
                  <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground tabular-nums">
                    <span>
                      {transactions.isPending ? "…" : formatMoney(saved, goal.currency)} of{" "}
                      {formatMoney(goal.targetCents, goal.currency)}
                    </span>
                    <span
                      className={cn(
                        percent < 100 && goal.targetDate && today && goal.targetDate < today && "text-destructive"
                      )}
                    >
                      {percent >= 100
                        ? "Goal reached 🎉"
                        : `${percent}%${
                            goal.targetDate
                              ? goal.targetDate < (today ?? "")
                                ? ` · past ${goal.targetDate}`
                                : ` · by ${goal.targetDate}`
                              : ""
                          }`}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
          <ListPagination pagination={pagination} />
        </WidgetCard>
      </div>
    </div>
  )
}
