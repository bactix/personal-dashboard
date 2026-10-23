import type { Bill, Invoice, LineItem } from "./types";

/** Sum of quantity x unit price over all line items, in cents (before the discount). */
export function invoiceSubtotalCents(items: LineItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unitCents, 0);
}

/** What the customer pays: subtotal minus the discount, in cents. */
export function invoiceTotalCents(invoice: Pick<Invoice, "items" | "discountCents">): number {
  return invoiceSubtotalCents(invoice.items) - invoice.discountCents;
}

/** What you pay the vendor: amount minus the discount, in cents. */
export function billTotalCents(bill: Pick<Bill, "amountCents" | "discountCents">): number {
  return bill.amountCents - bill.discountCents;
}

export type PaymentStatus = {
  label: "Draft" | "Sent" | "Unpaid" | "Paid" | "Overdue";
  variant: "outline" | "default" | "secondary" | "destructive";
};

/**
 * Display status of an invoice or bill. Anything unpaid (and not a draft) whose due date has
 * passed is "Overdue". `today` is yyyy-mm-dd, or null before the client has a date.
 */
export function paymentStatus(
  document: Pick<Invoice, "status" | "dueDate"> | Pick<Bill, "status" | "dueDate">,
  today: string | null
): PaymentStatus {
  if (document.status === "paid") return { label: "Paid", variant: "secondary" };
  if (document.status === "draft") return { label: "Draft", variant: "outline" };
  if (today && document.dueDate < today) return { label: "Overdue", variant: "destructive" };
  return document.status === "sent"
    ? { label: "Sent", variant: "default" }
    : { label: "Unpaid", variant: "default" };
}
