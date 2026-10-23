import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  deleteBill,
  deleteBillPayment,
  deleteBillReturn,
  deleteInvoice,
  deleteInvoicePayment,
  deleteInvoiceReturn,
  fetchBills,
  fetchInvoices,
  postBill,
  postBillPayment,
  postBillReturn,
  postInvoice,
  postInvoicePayment,
  postInvoiceReturn,
  putBill,
  putInvoice,
} from "./api";
import type { CreateBillInput, CreateInvoiceInput, CreatePaymentInput, CreateReturnInput } from "./types";

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

export function useAddInvoiceReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateReturnInput }) => postInvoiceReturn(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: invoicesQueryKey }),
  });
}

export function useRemoveInvoiceReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, returnId }: { id: string; returnId: string }) => deleteInvoiceReturn(id, returnId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: invoicesQueryKey }),
  });
}

export function useAddBillReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateReturnInput }) => postBillReturn(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: billsQueryKey }),
  });
}

export function useRemoveBillReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, returnId }: { id: string; returnId: string }) => deleteBillReturn(id, returnId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: billsQueryKey }),
  });
}

export function useAddInvoicePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreatePaymentInput }) => postInvoicePayment(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: invoicesQueryKey }),
  });
}

export function useRemoveInvoicePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, paymentId }: { id: string; paymentId: string }) => deleteInvoicePayment(id, paymentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: invoicesQueryKey }),
  });
}

export function useAddBillPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreatePaymentInput }) => postBillPayment(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: billsQueryKey }),
  });
}

export function useRemoveBillPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, paymentId }: { id: string; paymentId: string }) => deleteBillPayment(id, paymentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: billsQueryKey }),
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
