import { z } from "zod";

import { CURRENCIES } from "@/lib/money";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date");

export const INVOICE_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
] as const;

export const BILL_STATUSES = [
  { value: "unpaid", label: "Unpaid" },
  { value: "paid", label: "Paid" },
] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number]["value"];
export type BillStatus = (typeof BILL_STATUSES)[number]["value"];

export const lineItemSchema = z.object({
  description: z.string().trim().min(1, "Each line item needs a description").max(120, "Description is too long"),
  quantity: z.number().int("Quantity must be a whole number").positive("Quantity must be at least 1"),
  /** Minor units (cents) per unit. */
  unitCents: z.number().int().positive("Enter a unit price greater than zero"),
});

/** A return (credit note for an invoice, refund from a vendor for a bill): money given back. */
export const returnSchema = z.object({
  id: z.string(),
  date: isoDate,
  /** Minor units (cents) returned. */
  amountCents: z.number().int().positive(),
  reason: z.string().trim().max(200).optional(),
});

export const createReturnInputSchema = z.object({
  date: isoDate,
  amountCents: z.number().int().positive("Enter an amount greater than zero"),
  reason: z.string().trim().max(200, "Reason is too long").optional(),
});

/**
 * A payment recorded against an invoice (money received) or a vendor bill (money paid out).
 * Several partial payments are allowed, up to what is still outstanding.
 */
export const paymentRecordSchema = z.object({
  id: z.string(),
  date: isoDate,
  /** Minor units (cents) paid. */
  amountCents: z.number().int().positive(),
  note: z.string().trim().max(200).optional(),
});

export const createPaymentInputSchema = z.object({
  date: isoDate,
  amountCents: z.number().int().positive("Enter an amount greater than zero"),
  note: z.string().trim().max(200, "Note is too long").optional(),
});

const dueNotBeforeIssue = { message: "Due date can't be before the issue date", path: ["dueDate"] };

// ---- Invoices: money a customer owes you ----

const invoiceFields = {
  customer: z.string().trim().min(1, "Customer is required").max(80, "Customer name is too long"),
  currency: z.enum(CURRENCIES),
  items: z.array(lineItemSchema).min(1, "Add at least one line item").max(50, "Too many line items"),
  /** Minor units (cents) taken off the subtotal. Older records have none, hence the default. */
  discountCents: z.number().int().nonnegative().default(0),
  issueDate: isoDate,
  dueDate: isoDate,
  status: z.enum(INVOICE_STATUSES.map((item) => item.value) as [InvoiceStatus, ...InvoiceStatus[]]),
  notes: z.string().trim().max(500, "Notes are too long").optional(),
};
const invoiceDatesInOrder = (invoice: { issueDate: string; dueDate: string }) =>
  invoice.dueDate >= invoice.issueDate;
const discountWithinSubtotal = (invoice: { items: LineItem[]; discountCents: number }) =>
  invoice.discountCents <= invoice.items.reduce((sum, item) => sum + item.quantity * item.unitCents, 0);
const discountTooBig = { message: "Discount can't be more than the subtotal", path: ["discountCents"] };

export const invoiceSchema = z
  .object({
    id: z.string(),
    number: z.string(),
    ...invoiceFields,
    /** Managed through the returns / payments routes, never through the invoice form. */
    returns: z.array(returnSchema).default([]),
    payments: z.array(paymentRecordSchema).default([]),
    createdAt: z.string(),
  })
  .refine(invoiceDatesInOrder, dueNotBeforeIssue)
  .refine(discountWithinSubtotal, discountTooBig);

/** The invoice number (INV-0001, …) is assigned by the server. */
export const createInvoiceInputSchema = z
  .object(invoiceFields)
  .refine(invoiceDatesInOrder, dueNotBeforeIssue)
  .refine(discountWithinSubtotal, discountTooBig);

// ---- Vendor bills: money you owe a vendor ----

const billFields = {
  vendor: z.string().trim().min(1, "Vendor is required").max(80, "Vendor name is too long"),
  /** The vendor's own invoice / reference number. */
  reference: z.string().trim().max(60, "Reference is too long").optional(),
  currency: z.enum(CURRENCIES),
  /** Minor units (cents), before any discount. */
  amountCents: z.number().int().positive("Enter an amount greater than zero"),
  /** Minor units (cents) taken off the amount. Older records have none, hence the default. */
  discountCents: z.number().int().nonnegative().default(0),
  billDate: isoDate,
  dueDate: isoDate,
  status: z.enum(BILL_STATUSES.map((item) => item.value) as [BillStatus, ...BillStatus[]]),
  notes: z.string().trim().max(500, "Notes are too long").optional(),
};
const billDatesInOrder = (bill: { billDate: string; dueDate: string }) => bill.dueDate >= bill.billDate;
const dueNotBeforeBill = { message: "Due date can't be before the bill date", path: ["dueDate"] };

const billDiscountBelowAmount = (bill: { amountCents: number; discountCents: number }) =>
  bill.discountCents < bill.amountCents;
const billDiscountTooBig = { message: "Discount must be less than the amount", path: ["discountCents"] };

export const billSchema = z
  .object({
    id: z.string(),
    ...billFields,
    /** Managed through the returns / payments routes, never through the bill form. */
    returns: z.array(returnSchema).default([]),
    payments: z.array(paymentRecordSchema).default([]),
    createdAt: z.string(),
  })
  .refine(billDatesInOrder, dueNotBeforeBill)
  .refine(billDiscountBelowAmount, billDiscountTooBig);

export const createBillInputSchema = z
  .object(billFields)
  .refine(billDatesInOrder, dueNotBeforeBill)
  .refine(billDiscountBelowAmount, billDiscountTooBig);

export type ReturnRecord = z.infer<typeof returnSchema>;
export type CreateReturnInput = z.infer<typeof createReturnInputSchema>;
export type PaymentRecord = z.infer<typeof paymentRecordSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentInputSchema>;
export type LineItem = z.infer<typeof lineItemSchema>;
export type Invoice = z.infer<typeof invoiceSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceInputSchema>;
export type Bill = z.infer<typeof billSchema>;
export type CreateBillInput = z.infer<typeof createBillInputSchema>;
