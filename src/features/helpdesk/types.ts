import { z } from "zod";

export const TICKET_STATUSES = [
  { value: "open", label: "Open" },
  { value: "in-progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
] as const;

export const TICKET_PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number]["value"];
export type TicketPriority = (typeof TICKET_PRIORITIES)[number]["value"];

export const ticketStatusLabel = (status: TicketStatus): string =>
  TICKET_STATUSES.find((item) => item.value === status)?.label ?? status;

export const ticketPriorityLabel = (priority: TicketPriority): string =>
  TICKET_PRIORITIES.find((item) => item.value === priority)?.label ?? priority;

const fields = {
  title: z.string().trim().min(1, "Title is required").max(120, "Title is too long"),
  description: z.string().trim().max(1000, "Description is too long").optional(),
  /** Who asked for help (free text). */
  requester: z.string().trim().max(80, "Requester is too long").optional(),
  priority: z.enum(TICKET_PRIORITIES.map((item) => item.value) as [TicketPriority, ...TicketPriority[]]),
  status: z.enum(TICKET_STATUSES.map((item) => item.value) as [TicketStatus, ...TicketStatus[]]),
};

export const ticketSchema = z.object({
  id: z.string(),
  ...fields,
  createdAt: z.string(),
});

export const createTicketInputSchema = z.object(fields);

export type Ticket = z.infer<typeof ticketSchema>;
export type CreateTicketInput = z.infer<typeof createTicketInputSchema>;
