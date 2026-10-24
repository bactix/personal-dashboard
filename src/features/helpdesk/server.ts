import { createSupabaseStore } from "@/lib/storage/supabase-store";

import { ticketSchema, type CreateTicketInput, type Ticket } from "./types";

// Server-only: persistence for help desk tickets. Used by app/api/tickets.

const store = createSupabaseStore({ table: "tickets", schema: ticketSchema });

const STATUS_ORDER = { open: 0, "in-progress": 1, resolved: 2 } as const;
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 } as const;

/** Unresolved first, then highest priority, then newest. */
export async function listTickets(): Promise<Ticket[]> {
  const tickets = await store.list();
  return tickets.sort(
    (a, b) =>
      STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
      PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
      b.createdAt.localeCompare(a.createdAt)
  );
}

export function createTicket(input: CreateTicketInput): Promise<Ticket> {
  return store.create(input);
}

export function updateTicket(id: string, input: CreateTicketInput): Promise<Ticket | undefined> {
  return store.update(id, input);
}

export function removeTicket(id: string): Promise<boolean> {
  return store.remove(id);
}
