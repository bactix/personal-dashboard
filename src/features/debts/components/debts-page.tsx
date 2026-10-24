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
import { useContacts } from "@/features/contacts"
import { usePagination } from "@/hooks/use-pagination"
import { formatMoney } from "@/lib/money"
import { formatCreatedDate } from "@/lib/dates"

import { useDebts, useDeleteDebt } from "../hooks"
import { totalsFor } from "../totals"
import { DebtDialog } from "./debt-dialog"

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

export function DebtsPage() {
  const query = useDebts()
  const deleteDebt = useDeleteDebt()
  const contacts = useContacts()
  const debts = query.data ?? []
  const pagination = usePagination(debts)
  const nameById = new Map(contacts.data?.map((contact) => [contact.id, contact.name]))

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SummaryCard label="You owe" value={totalsFor(debts, "i-owe")} />
        <SummaryCard label="Owed to you" value={totalsFor(debts, "owed-to-me")} />
      </div>

      <WidgetCard
        title="Debts"
        description={query.data ? `${debts.length} recorded` : undefined}
        query={query}
        action={<DebtDialog />}
        isEmpty={debts.length === 0}
        emptyMessage="No debts recorded yet. Use Add debt to create one."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contact</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Note</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-20">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagination.pageItems.map((debt) => (
              <TableRow key={debt.id}>
                <TableCell className="font-medium">
                  {nameById.get(debt.contactId) ?? "Unknown contact"}
                </TableCell>
                <TableCell>
                  <Badge variant={debt.direction === "i-owe" ? "destructive" : "secondary"}>
                    {debt.direction === "i-owe" ? "I owe" : "Owes me"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(debt.amountCents, debt.currency)}
                </TableCell>
                <TableCell>{debt.dueDate ?? "—"}</TableCell>
                <TableCell className="max-w-48 truncate text-muted-foreground">
                  {debt.description ?? "—"}
                </TableCell>
                <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">{formatCreatedDate(debt.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end">
                    <DebtDialog debt={debt} />
                    <DeleteButton
                      itemLabel={"debt"}
                      onDelete={() => deleteDebt.mutateAsync(debt.id)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <ListPagination pagination={pagination} />
      </WidgetCard>
    </div>
  )
}
