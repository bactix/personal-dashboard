import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { deleteContact, fetchContacts, postContact, putContact } from "./api";
import type { CreateContactInput } from "./types";

export const contactsQueryKey = ["contacts"] as const;

export function useContacts() {
  return useQuery({ queryKey: contactsQueryKey, queryFn: fetchContacts });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postContact,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contactsQueryKey }),
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteContact,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contactsQueryKey }),
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateContactInput }) => putContact(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contactsQueryKey }),
  });
}
