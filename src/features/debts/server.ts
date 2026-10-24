import { getContact } from "@/features/contacts/server";
import {
  createTransaction,
  getWallet,
  removeTransaction,
  WalletNotFoundError,
} from "@/features/wallets/server";
import { InUseError } from "@/lib/api/delete-route";
import { formatMoney } from "@/lib/money";
import { createSupabaseStore } from "@/lib/storage/supabase-store";

import {
  debtPaymentSchema,
  debtSchema,
  type CreateDebtInput,
  type Debt,
  type PayDebtInput,
} from "./types";

// Server-only: persistence for debts and their payments. Used by app/api/debts.

/** The database spells the directions with underscores; the app uses hyphens. */
const DIRECTION_TO_DB = { "i-owe": "i_owe", "owed-to-me": "owed_to_me" } as const;
const DIRECTION_FROM_DB = { i_owe: "i-owe", owed_to_me: "owed-to-me" } as const;

const store = createSupabaseStore({
  table: "debts",
  schema: debtSchema,
  // paidCents is derived from the payments table, not stored on the debt.
  exclude: ["paidCents"],
  readFix(candidate, raw) {
    candidate.direction = DIRECTION_FROM_DB[raw.direction as keyof typeof DIRECTION_FROM_DB];
    candidate.paidCents = 0;
  },
  writeFix(row, input) {
    row.direction = DIRECTION_TO_DB[input.direction];
  },
});

const payments = createSupabaseStore({ table: "debt_payments", schema: debtPaymentSchema });

export class ContactNotFoundError extends Error {
  constructor() {
    super("Contact not found");
    this.name = "ContactNotFoundError";
  }
}

/** A payment or edit the debt can't accept (too much, wrong currency, ...); routes map it to a 400. */
export class PaymentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentError";
  }
}

async function paidByDebt(): Promise<Map<string, number>> {
  const paid = new Map<string, number>();
  for (const payment of await payments.list()) {
    paid.set(payment.debtId, (paid.get(payment.debtId) ?? 0) + payment.amountCents);
  }
  return paid;
}

async function paidFor(debtId: string): Promise<number> {
  return (await paidByDebt()).get(debtId) ?? 0;
}

export async function listDebts(): Promise<Debt[]> {
  const [debts, paid] = await Promise.all([store.list(), paidByDebt()]);
  return debts
    .map((debt) => ({ ...debt, paidCents: paid.get(debt.id) ?? 0 }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createDebt(input: CreateDebtInput): Promise<Debt> {
  if (!(await getContact(input.contactId))) throw new ContactNotFoundError();
  return store.create({ ...input, paidCents: 0 });
}

export async function removeDebt(id: string): Promise<boolean> {
  if ((await paidFor(id)) > 0) {
    throw new InUseError("This debt has payments. Delete those transactions in the wallet first.");
  }
  return store.remove(id);
}

export async function updateDebt(id: string, input: CreateDebtInput): Promise<Debt | undefined> {
  if (!(await getContact(input.contactId))) throw new ContactNotFoundError();
  const current = await store.get(id);
  if (!current) return undefined;

  const paidCents = await paidFor(id);
  if (paidCents > 0) {
    if (input.amountCents < paidCents) {
      throw new PaymentError(`${formatMoney(paidCents, current.currency)} is already paid, so the amount can't be lower.`);
    }
    if (input.currency !== current.currency || input.direction !== current.direction) {
      throw new PaymentError("The type and currency can't change once the debt has payments.");
    }
  }
  const updated = await store.update(id, { ...input, paidCents });
  return updated && { ...updated, paidCents };
}

/**
 * Pays part or all of a debt from a wallet: books a wallet transaction (money out for a debt I
 * owe, money in for a debt owed to me) and records the payment against the debt. Resolves to
 * undefined when the debt doesn't exist.
 */
export async function payDebt(id: string, input: PayDebtInput): Promise<Debt | undefined> {
  const debt = await store.get(id);
  if (!debt) return undefined;

  const paidCents = await paidFor(id);
  const remaining = debt.amountCents - paidCents;
  if (remaining <= 0) throw new PaymentError("This debt is already fully paid.");
  if (input.amountCents > remaining) {
    throw new PaymentError(`Only ${formatMoney(remaining, debt.currency)} is left on this debt.`);
  }

  const wallet = await getWallet(input.walletId);
  if (!wallet) throw new WalletNotFoundError();
  if (wallet.currency !== debt.currency) {
    throw new PaymentError(`This debt is in ${debt.currency}, but ${wallet.name} uses ${wallet.currency}.`);
  }

  const contact = await getContact(debt.contactId);
  const owing = debt.direction === "i-owe";
  const note = `${owing ? "Debt payment to" : "Debt payment from"} ${contact?.name ?? "contact"}`;

  // Throws InsufficientFundsError when a withdrawal is more than the wallet holds.
  const transaction = await createTransaction({
    walletId: wallet.id,
    type: owing ? "withdrawal" : "deposit",
    amountCents: input.amountCents,
    note: note.slice(0, 200),
    date: input.date,
  });
  try {
    await payments.create({
      debtId: debt.id,
      transactionId: transaction.id,
      amountCents: input.amountCents,
    });
  } catch (error) {
    await removeTransaction(transaction.id); // don't leave money moved with no payment recorded
    throw error;
  }
  return { ...debt, paidCents: paidCents + input.amountCents };
}
