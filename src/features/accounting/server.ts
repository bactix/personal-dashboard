import { randomUUID } from "node:crypto";

import { createJsonStore } from "@/lib/storage/json-store";

import { billTotalCents, invoiceTotalCents, paidCents, returnedCents } from "./totals";
import {
  billSchema,
  invoiceSchema,
  type Bill,
  type CreateBillInput,
  type CreateInvoiceInput,
  type CreatePaymentInput,
  type CreateReturnInput,
  type Invoice,
  type PaymentRecord,
  type ReturnRecord,
} from "./types";

// Server-only: persistence for invoices and vendor bills, with their returns and payments.
// Used by app/api/invoices and app/api/bills.

/** Thrown when returns + payments would exceed what the invoice / bill is worth; routes map it to a 400. */
export class LimitExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LimitExceededError";
  }
}

/** Returns and payments together can never be more than the document's total. */
function assertWithinTotal(
  totalCents: number,
  document: { returns: ReturnRecord[]; payments: PaymentRecord[] },
  message: string
) {
  if (returnedCents(document) + paidCents(document) > totalCents) throw new LimitExceededError(message);
}

const invoices = createJsonStore("invoices", invoiceSchema);
const bills = createJsonStore("bills", billSchema);

// ---- Invoices ----

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
  return invoices.create({
    ...input,
    returns: [],
    payments: [],
    number: `INV-${String(highest + 1).padStart(4, "0")}`,
  });
}

export async function updateInvoice(id: string, input: CreateInvoiceInput): Promise<Invoice | undefined> {
  const current = await invoices.get(id);
  if (!current) return undefined;
  // Returns and payments are managed separately; keep them, but never let an edit shrink the
  // total below what has already been returned and paid.
  const next = { ...input, number: current.number, returns: current.returns, payments: current.payments };
  assertWithinTotal(invoiceTotalCents(next), next, "The total can't be less than what was already returned and paid");
  return invoices.update(id, next);
}

export function removeInvoice(id: string): Promise<boolean> {
  return invoices.remove(id);
}

export async function addInvoiceReturn(id: string, input: CreateReturnInput): Promise<Invoice | undefined> {
  const current = await invoices.get(id);
  if (!current) return undefined;
  const next = { ...current, returns: [...current.returns, { ...input, id: randomUUID() }] };
  assertWithinTotal(invoiceTotalCents(next), next, "Returns can't be more than the invoice total minus what was paid");
  return invoices.update(id, next);
}

/** False when the invoice or the return doesn't exist. */
export async function removeInvoiceReturn(id: string, returnId: string): Promise<boolean> {
  const current = await invoices.get(id);
  if (!current || !current.returns.some((item) => item.id === returnId)) return false;
  await invoices.update(id, { ...current, returns: current.returns.filter((item) => item.id !== returnId) });
  return true;
}

export async function addInvoicePayment(id: string, input: CreatePaymentInput): Promise<Invoice | undefined> {
  const current = await invoices.get(id);
  if (!current) return undefined;
  const next = { ...current, payments: [...current.payments, { ...input, id: randomUUID() }] };
  assertWithinTotal(invoiceTotalCents(next), next, "Payments can't be more than what is still owed");
  return invoices.update(id, next);
}

/** False when the invoice or the payment doesn't exist. */
export async function removeInvoicePayment(id: string, paymentId: string): Promise<boolean> {
  const current = await invoices.get(id);
  if (!current || !current.payments.some((item) => item.id === paymentId)) return false;
  await invoices.update(id, { ...current, payments: current.payments.filter((item) => item.id !== paymentId) });
  return true;
}

// ---- Vendor bills ----

/** Newest first. */
export async function listBills(): Promise<Bill[]> {
  const all = await bills.list();
  return all.sort((a, b) => b.billDate.localeCompare(a.billDate) || b.createdAt.localeCompare(a.createdAt));
}

export function createBill(input: CreateBillInput): Promise<Bill> {
  return bills.create({ ...input, returns: [], payments: [] });
}

export async function updateBill(id: string, input: CreateBillInput): Promise<Bill | undefined> {
  const current = await bills.get(id);
  if (!current) return undefined;
  const next = { ...input, returns: current.returns, payments: current.payments };
  assertWithinTotal(billTotalCents(next), next, "The amount can't be less than what was already returned and paid");
  return bills.update(id, next);
}

export function removeBill(id: string): Promise<boolean> {
  return bills.remove(id);
}

export async function addBillReturn(id: string, input: CreateReturnInput): Promise<Bill | undefined> {
  const current = await bills.get(id);
  if (!current) return undefined;
  const next = { ...current, returns: [...current.returns, { ...input, id: randomUUID() }] };
  assertWithinTotal(billTotalCents(next), next, "Returns can't be more than the bill amount minus what was paid");
  return bills.update(id, next);
}

/** False when the bill or the return doesn't exist. */
export async function removeBillReturn(id: string, returnId: string): Promise<boolean> {
  const current = await bills.get(id);
  if (!current || !current.returns.some((item) => item.id === returnId)) return false;
  await bills.update(id, { ...current, returns: current.returns.filter((item) => item.id !== returnId) });
  return true;
}

export async function addBillPayment(id: string, input: CreatePaymentInput): Promise<Bill | undefined> {
  const current = await bills.get(id);
  if (!current) return undefined;
  const next = { ...current, payments: [...current.payments, { ...input, id: randomUUID() }] };
  assertWithinTotal(billTotalCents(next), next, "Payments can't be more than what is still owed");
  return bills.update(id, next);
}

/** False when the bill or the payment doesn't exist. */
export async function removeBillPayment(id: string, paymentId: string): Promise<boolean> {
  const current = await bills.get(id);
  if (!current || !current.payments.some((item) => item.id === paymentId)) return false;
  await bills.update(id, { ...current, payments: current.payments.filter((item) => item.id !== paymentId) });
  return true;
}
