import { z } from "zod";

import { http } from "@/lib/http/client";
import { httpDelete } from "@/lib/http/delete";

import { ticketSchema, type CreateTicketInput, type Ticket } from "./types";

export function fetchTickets(): Promise<Ticket[]> {
  return http("/api/tickets", z.array(ticketSchema));
}

export function postTicket(input: CreateTicketInput): Promise<Ticket> {
  return http("/api/tickets", ticketSchema, { method: "POST", json: input });
}

export function putTicket(id: string, input: CreateTicketInput): Promise<Ticket> {
  return http(`/api/tickets/${encodeURIComponent(id)}`, ticketSchema, { method: "PUT", json: input });
}

export function deleteTicket(id: string): Promise<void> {
  return httpDelete(`/api/tickets/${encodeURIComponent(id)}`);
}
