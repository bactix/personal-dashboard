import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { deleteTicket, fetchTickets, postTicket, putTicket } from "./api";
import type { CreateTicketInput } from "./types";

export const ticketsQueryKey = ["tickets"] as const;

export function useTickets() {
  return useQuery({ queryKey: ticketsQueryKey, queryFn: fetchTickets });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postTicket,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ticketsQueryKey }),
  });
}

export function useUpdateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateTicketInput }) => putTicket(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ticketsQueryKey }),
  });
}

export function useDeleteTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTicket,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ticketsQueryKey }),
  });
}
