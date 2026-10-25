"use client"

import { DeleteButton } from "@/components/dashboard/delete-button"
import { ListPagination } from "@/components/dashboard/list-pagination"
import { WidgetCard } from "@/components/dashboard/widget-card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { usePagination } from "@/hooks/use-pagination"
import { formatCreatedDate } from "@/lib/dates"

import { useDeleteTicket, useTickets } from "../hooks"
import {
  ticketPriorityLabel,
  ticketStatusLabel,
  type TicketPriority,
  type TicketStatus,
} from "../types"
import { TicketDialog } from "./ticket-dialog"

const PRIORITY_VARIANT: Record<TicketPriority, "destructive" | "default" | "secondary"> = {
  high: "destructive",
  medium: "default",
  low: "secondary",
}

const STATUS_VARIANT: Record<TicketStatus, "outline" | "default" | "secondary"> = {
  open: "outline",
  "in-progress": "default",
  resolved: "secondary",
}

export function HelpDeskPage() {
  const query = useTickets()
  const deleteTicket = useDeleteTicket()
  const tickets = query.data ?? []
  const pagination = usePagination(tickets)

  return (
    <div className="px-4 lg:px-6">
      <div className="flex flex-col gap-4">
        <WidgetCard
          title="Help desk"
          description={query.data ? `${tickets.length} total` : undefined}
          query={query}
          action={<TicketDialog />}
          isEmpty={tickets.length === 0}
          emptyMessage="No tickets yet. Use Add ticket to log a request for help."
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>Requested by</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-20">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.pageItems.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="whitespace-normal break-words">
                    <p className="font-medium">{ticket.title}</p>
                    {ticket.description && (
                      <p className="line-clamp-2 text-xs text-muted-foreground">{ticket.description}</p>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-normal break-words text-muted-foreground">
                    {ticket.requester ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={PRIORITY_VARIANT[ticket.priority]}>
                      {ticketPriorityLabel(ticket.priority)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[ticket.status]}>
                      {ticketStatusLabel(ticket.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">{formatCreatedDate(ticket.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end">
                      <TicketDialog ticket={ticket} />
                      <DeleteButton
                        itemLabel={`ticket “${ticket.title}”`}
                        onDelete={() => deleteTicket.mutateAsync(ticket.id)}
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
    </div>
  )
}
