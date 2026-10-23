import { z } from "zod";

import { http } from "@/lib/http/client";
import { httpDelete } from "@/lib/http/delete";

import {
  billSchema,
  invoiceSchema,
  type Bill,
  type CreateBillInput,
  type CreateInvoiceInput,
  type CreatePaymentInput,
  type CreateReturnInput,
  type Invoice,
} from "./types";

export function fetchInvoices(): Promise<Invoice[]> {
  return http("/api/invoices", z.array(invoiceSchema));
}

export function postInvoice(input: CreateInvoiceInput): Promise<Invoice> {
  return http("/api/invoices", invoiceSchema, { method: "POST", json: input });
}

export function putInvoice(id: string, input: CreateInvoiceInput): Promise<Invoice> {
  return http(`/api/invoices/${encodeURIComponent(id)}`, invoiceSchema, { method: "PUT", json: input });
}

export function deleteInvoice(id: string): Promise<void> {
  return httpDelete(`/api/invoices/${encodeURIComponent(id)}`);
}

export function postInvoiceReturn(id: string, input: CreateReturnInput): Promise<Invoice> {
  return http(`/api/invoices/${encodeURIComponent(id)}/returns`, invoiceSchema, { method: "POST", json: input });
}

export function deleteInvoiceReturn(id: string, returnId: string): Promise<void> {
  return httpDelete(`/api/invoices/${encodeURIComponent(id)}/returns/${encodeURIComponent(returnId)}`);
}

export function postBillReturn(id: string, input: CreateReturnInput): Promise<Bill> {
  return http(`/api/bills/${encodeURIComponent(id)}/returns`, billSchema, { method: "POST", json: input });
}

export function deleteBillReturn(id: string, returnId: string): Promise<void> {
  return httpDelete(`/api/bills/${encodeURIComponent(id)}/returns/${encodeURIComponent(returnId)}`);
}

export function postInvoicePayment(id: string, input: CreatePaymentInput): Promise<Invoice> {
  return http(`/api/invoices/${encodeURIComponent(id)}/payments`, invoiceSchema, { method: "POST", json: input });
}

export function deleteInvoicePayment(id: string, paymentId: string): Promise<void> {
  return httpDelete(`/api/invoices/${encodeURIComponent(id)}/payments/${encodeURIComponent(paymentId)}`);
}

export function postBillPayment(id: string, input: CreatePaymentInput): Promise<Bill> {
  return http(`/api/bills/${encodeURIComponent(id)}/payments`, billSchema, { method: "POST", json: input });
}

export function deleteBillPayment(id: string, paymentId: string): Promise<void> {
  return httpDelete(`/api/bills/${encodeURIComponent(id)}/payments/${encodeURIComponent(paymentId)}`);
}

export function fetchBills(): Promise<Bill[]> {
  return http("/api/bills", z.array(billSchema));
}

export function postBill(input: CreateBillInput): Promise<Bill> {
  return http("/api/bills", billSchema, { method: "POST", json: input });
}

export function putBill(id: string, input: CreateBillInput): Promise<Bill> {
  return http(`/api/bills/${encodeURIComponent(id)}`, billSchema, { method: "PUT", json: input });
}

export function deleteBill(id: string): Promise<void> {
  return httpDelete(`/api/bills/${encodeURIComponent(id)}`);
}
