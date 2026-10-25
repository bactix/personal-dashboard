import {
  createTransaction,
  getWallet,
  removeTransaction,
  WalletNotFoundError,
} from "@/features/wallets/server";
import { InUseError } from "@/lib/api/delete-route";
import { createSupabaseStore } from "@/lib/storage/supabase-store";

import {
  subscriptionPaymentSchema,
  subscriptionSchema,
  type CreateSubscriptionInput,
  type PaySubscriptionInput,
  type Subscription,
  type SubscriptionPayment,
} from "./types";

// Server-only: persistence for subscriptions and their payments. Used by app/api/subscriptions.

const store = createSupabaseStore({ table: "subscriptions", schema: subscriptionSchema });
const payments = createSupabaseStore({ table: "subscription_payments", schema: subscriptionPaymentSchema });

/** A payment the subscription can't accept (wrong currency, already paid, ...); routes map it to a 400. */
export class SubscriptionPaymentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SubscriptionPaymentError";
  }
}

export async function listSubscriptions(): Promise<Subscription[]> {
  const items = await store.list();
  return items.sort((a, b) => a.name.localeCompare(b.name));
}

export function createSubscription(input: CreateSubscriptionInput): Promise<Subscription> {
  return store.create(input);
}

export function updateSubscription(
  id: string,
  input: CreateSubscriptionInput
): Promise<Subscription | undefined> {
  return store.update(id, input);
}

export async function removeSubscription(id: string): Promise<boolean> {
  const mine = (await payments.list()).filter((payment) => payment.subscriptionId === id);
  if (mine.length > 0) {
    throw new InUseError("This subscription has payments. Delete those transactions in the wallet first.");
  }
  return store.remove(id);
}

export async function listSubscriptionPayments(): Promise<SubscriptionPayment[]> {
  const items = await payments.list();
  return items.sort((a, b) => b.paidDate.localeCompare(a.paidDate));
}

/**
 * Pays one renewal of a subscription from a wallet: books a withdrawal in that wallet and records
 * the payment (with the due date it covers) against the subscription. Resolves to undefined when
 * the subscription doesn't exist.
 */
export async function paySubscription(
  id: string,
  input: PaySubscriptionInput
): Promise<SubscriptionPayment | undefined> {
  const subscription = await store.get(id);
  if (!subscription) return undefined;

  const wallet = await getWallet(input.walletId);
  if (!wallet) throw new WalletNotFoundError();
  if (wallet.currency !== subscription.currency) {
    throw new SubscriptionPaymentError(
      `This subscription is in ${subscription.currency}, but ${wallet.name} uses ${wallet.currency}.`
    );
  }

  const existing = await payments.list();
  if (existing.some((p) => p.subscriptionId === id && p.dueDate === input.dueDate)) {
    throw new SubscriptionPaymentError(`The renewal due ${input.dueDate} is already paid.`);
  }

  // Throws InsufficientFundsError when the wallet holds less than the amount.
  const transaction = await createTransaction({
    walletId: wallet.id,
    type: "withdrawal",
    amountCents: subscription.amountCents,
    note: `Subscription: ${subscription.name}`.slice(0, 200),
    date: input.paidDate,
  });
  try {
    return await payments.create({
      subscriptionId: id,
      transactionId: transaction.id,
      amountCents: subscription.amountCents,
      dueDate: input.dueDate,
      paidDate: input.paidDate,
    });
  } catch (error) {
    await removeTransaction(transaction.id); // don't leave money moved with no payment recorded
    throw error;
  }
}
