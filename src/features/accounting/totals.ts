import type { Bill, Invoice, LineItem, PaymentRecord, ReturnRecord } from "./types";

/** Sum of all returns recorded against an invoice or bill, in cents. */
export function returnedCents(document: { returns: ReturnRecord[] }): number {
  return document.returns.reduce((sum, item) => sum + item.amountCents, 0);
}

/** Sum of all payments recorded against an invoice or bill, in cents. */
export function paidCents(document: { payments: PaymentRecord[] }): number {
  return document.payments.reduce((sum, item) => sum + item.amountCents, 0);
}

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

/** Invoice total after returns (credit notes), in cents. */
export function invoiceNetCents(invoice: Pick<Invoice, "items" | "discountCents" | "returns">): number {
  return invoiceTotalCents(invoice) - returnedCents(invoice);
}

/** Bill total after returns (vendor refunds), in cents. */
export function billNetCents(bill: Pick<Bill, "amountCents" | "discountCents" | "returns">): number {
  return billTotalCents(bill) - returnedCents(bill);
}

/** What the customer still owes: net total minus payments received, in cents. */
export function invoiceOutstandingCents(
  invoice: Pick<Invoice, "items" | "discountCents" | "returns" | "payments">
): number {
  return invoiceNetCents(invoice) - paidCents(invoice);
}

/** What you still owe the vendor: net amount minus payments made, in cents. */
export function billOutstandingCents(
  bill: Pick<Bill, "amountCents" | "discountCents" | "returns" | "payments">
): number {
  return billNetCents(bill) - paidCents(bill);
}

export type PaymentStatus = {
  label: "Draft" | "Sent" | "Unpaid" | "Partially paid" | "Paid" | "Overdue";
  variant: "outline" | "default" | "secondary" | "destructive";
};

/**
 * Display status of an invoice or bill. It is "Paid" when marked paid or when its recorded
 * payments cover everything outstanding; "Partially paid" while some payments are in. Anything
 * unpaid (and not a draft) whose due date has passed is "Overdue". `today` is yyyy-mm-dd, or
 * null before the client has a date. `outstandingCents` comes from the *OutstandingCents helpers.
 */
export function paymentStatus(
  document: Pick<Invoice, "status" | "dueDate" | "payments"> | Pick<Bill, "status" | "dueDate" | "payments">,
  today: string | null,
  outstandingCents: number
): PaymentStatus {
  const hasPayments = document.payments.length > 0
  if (document.status === "paid" || (hasPayments && outstandingCents <= 0)) {
    return { label: "Paid", variant: "secondary" };
  }
  if (document.status === "draft") return { label: "Draft", variant: "outline" };
  if (today && document.dueDate < today) return { label: "Overdue", variant: "destructive" };
  if (hasPayments) return { label: "Partially paid", variant: "default" };
  return document.status === "sent"
    ? { label: "Sent", variant: "default" }
    : { label: "Unpaid", variant: "default" };
}
