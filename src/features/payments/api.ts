import { z } from "zod";

import { http } from "@/lib/http/client";
import { httpDelete } from "@/lib/http/delete";

import {
  billSchema,
  invoiceSchema,
  type Bill,
  type CreateBillInput,
  type CreateInvoiceInput,
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
