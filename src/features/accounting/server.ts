import { createJsonStore } from "@/lib/storage/json-store";

import {
  billSchema,
  invoiceSchema,
  type Bill,
  type CreateBillInput,
  type CreateInvoiceInput,
  type Invoice,
} from "./types";

// Server-only: persistence for invoices and vendor bills.
// Used by app/api/invoices and app/api/bills.

const invoices = createJsonStore("invoices", invoiceSchema);
const bills = createJsonStore("bills", billSchema);

/** Newest first. */
export async function listInvoices(): Promise<Invoice[]> {
  const all = await invoices.list();
  return all.sort((a, b) => b.issueDate.localeCompare(a.issueDate) || b.createdAt.localeCompare(a.createdAt));
}

/** Assigns the next number (INV-0001, INV-0002, …); numbers of deleted invoices are not reused below the max. */
export async function createInvoice(input: CreateInvoiceInput): Promise<Invoice> {
  const highest = (await invoices.list()).reduce(
    (max, invoice) => Math.max(max, Number(invoice.number.replace(/\D/g, "")) || 0),
    0
  );
  return invoices.create({ ...input, number: `INV-${String(highest + 1).padStart(4, "0")}` });
}

export async function updateInvoice(id: string, input: CreateInvoiceInput): Promise<Invoice | undefined> {
  const current = await invoices.get(id);
  if (!current) return undefined;
  return invoices.update(id, { ...input, number: current.number });
}

export function removeInvoice(id: string): Promise<boolean> {
  return invoices.remove(id);
}

/** Newest first. */
export async function listBills(): Promise<Bill[]> {
  const all = await bills.list();
  return all.sort((a, b) => b.billDate.localeCompare(a.billDate) || b.createdAt.localeCompare(a.createdAt));
}

export function createBill(input: CreateBillInput): Promise<Bill> {
  return bills.create(input);
}

export function updateBill(id: string, input: CreateBillInput): Promise<Bill | undefined> {
  return bills.update(id, input);
}

export function removeBill(id: string): Promise<boolean> {
  return bills.remove(id);
}
