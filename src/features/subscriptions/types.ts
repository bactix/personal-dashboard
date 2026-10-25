import { z } from "zod";

import { CURRENCIES } from "@/lib/money";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date");

export const SUBSCRIPTION_CYCLES = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Every 3 months" },
  { value: "yearly", label: "Yearly" },
] as const;

export const SUBSCRIPTION_STATUSES = [
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export type SubscriptionCycle = (typeof SUBSCRIPTION_CYCLES)[number]["value"];
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number]["value"];

export const cycleLabel = (cycle: SubscriptionCycle): string =>
  SUBSCRIPTION_CYCLES.find((item) => item.value === cycle)?.label ?? cycle;

export const statusLabel = (status: SubscriptionStatus): string =>
  SUBSCRIPTION_STATUSES.find((item) => item.value === status)?.label ?? status;

const fields = {
  name: z.string().trim().min(1, "Name is required").max(80, "Name is too long"),
  /** Minor units (cents) charged each billing cycle. */
  amountCents: z.number().int().positive("Enter an amount greater than zero"),
  currency: z.enum(CURRENCIES),
  cycle: z.enum(SUBSCRIPTION_CYCLES.map((item) => item.value) as [SubscriptionCycle, ...SubscriptionCycle[]]),
  /** Day of the first charge (yyyy-mm-dd). Later renewals are worked out from it. */
  startDate: isoDate,
  status: z.enum(SUBSCRIPTION_STATUSES.map((item) => item.value) as [SubscriptionStatus, ...SubscriptionStatus[]]),
  notes: z.string().trim().max(500, "Notes are too long").optional(),
};

export const subscriptionSchema = z.object({
  id: z.string(),
  ...fields,
  createdAt: z.string(),
});

export const createSubscriptionInputSchema = z.object(fields);

/** One recorded payment of a subscription; the money also sits in a wallet transaction. */
export const subscriptionPaymentSchema = z.object({
  id: z.string(),
  subscriptionId: z.string().min(1),
  transactionId: z.string().min(1),
  amountCents: z.number().int().positive(),
  /** The renewal date this payment covers (yyyy-mm-dd). */
  dueDate: isoDate,
  /** The day it was actually paid (yyyy-mm-dd). After `dueDate` means late. */
  paidDate: isoDate,
  createdAt: z.string(),
});

/** Paying a subscription from a wallet of the same currency. */
export const paySubscriptionInputSchema = z.object({
  walletId: z.string().min(1, "Choose a wallet"),
  dueDate: isoDate,
  paidDate: isoDate,
});

export const isLatePayment = (payment: Pick<SubscriptionPayment, "dueDate" | "paidDate">): boolean =>
  payment.paidDate > payment.dueDate;

export type SubscriptionPayment = z.infer<typeof subscriptionPaymentSchema>;
export type PaySubscriptionInput = z.infer<typeof paySubscriptionInputSchema>;
export type Subscription = z.infer<typeof subscriptionSchema>;
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionInputSchema>;
