import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  deleteBill,
  deleteInvoice,
  fetchBills,
  fetchInvoices,
  postBill,
  postInvoice,
  putBill,
  putInvoice,
} from "./api";
import type { CreateBillInput, CreateInvoiceInput } from "./types";

export const invoicesQueryKey = ["invoices"] as const;
export const billsQueryKey = ["bills"] as const;

export function useInvoices() {
  return useQuery({ queryKey: invoicesQueryKey, queryFn: fetchInvoices });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postInvoice,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: invoicesQueryKey }),
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateInvoiceInput }) => putInvoice(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: invoicesQueryKey }),
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteInvoice,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: invoicesQueryKey }),
  });
}

export function useBills() {
  return useQuery({ queryKey: billsQueryKey, queryFn: fetchBills });
}

export function useCreateBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postBill,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: billsQueryKey }),
  });
}

export function useUpdateBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateBillInput }) => putBill(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: billsQueryKey }),
  });
}

export function useDeleteBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBill,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: billsQueryKey }),
  });
}
