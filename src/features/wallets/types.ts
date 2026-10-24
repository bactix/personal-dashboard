import { z } from "zod";

import { CURRENCIES } from "@/lib/money";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date");

export const walletSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(60),
  currency: z.enum(CURRENCIES),
  /** Money already in the wallet when it was added, in cents. Transactions count on top of it. */
  startingCents: z.number().int().nonnegative().default(0),
  createdAt: z.string(),
});

export const createWalletInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60, "Name is too long"),
  currency: z.enum(CURRENCIES),
  startingCents: z.number().int().nonnegative("The starting balance can't be negative").default(0),
});

/** "deposit" adds money to a wallet; "withdrawal" takes money out of it. */
export const transactionTypeSchema = z.enum(["deposit", "withdrawal"]);

export const transactionSchema = z.object({
  id: z.string(),
  walletId: z.string().min(1),
  type: transactionTypeSchema,
  /** Minor units (cents). Always positive; `type` decides the sign. */
  amountCents: z.number().int().positive(),
  note: z.string().max(200).optional(),
  /** Day the money moved (yyyy-mm-dd). */
  date: isoDate,
  /** Both sides of a wallet-to-wallet transfer share this id. Set only by the transfer feature. */
  transferId: z.string().min(1).optional(),
  /** Optional budget this withdrawal counts against. Only withdrawals can have one. */
  budgetId: z.string().min(1).optional(),
  createdAt: z.string(),
});

// A transfer id is never accepted from the client: transfers go through the transfer routes.
export const createTransactionInputSchema = transactionSchema.omit({
  id: true,
  createdAt: true,
  transferId: true,
});

/** Moves money from one wallet to another of the same currency. */
export const createTransferInputSchema = z
  .object({
    fromWalletId: z.string().min(1, "Choose the wallet to take money from"),
    toWalletId: z.string().min(1, "Choose the wallet to move money into"),
    /** Minor units (cents). */
    amountCents: z.number().int().positive("Enter an amount greater than zero"),
    /** Day the money moved (yyyy-mm-dd). */
    date: isoDate,
    note: z.string().trim().max(150, "Note is too long").optional(),
  })
  .refine((transfer) => transfer.fromWalletId !== transfer.toWalletId, {
    message: "Choose two different wallets",
    path: ["toWalletId"],
  });

/** What is stored: a savings target linked to the wallet that holds its money. */
export const goalRecordSchema = z.object({
  id: z.string(),
  walletId: z.string().min(1),
  /** Minor units (cents). */
  targetCents: z.number().int().positive(),
  /** Day to reach the target by (yyyy-mm-dd). Goals saved before this existed have none. */
  targetDate: isoDate.optional(),
  createdAt: z.string(),
});

/** A goal as the UI sees it: the record joined with its wallet's name and currency. */
export const goalSchema = z.object({
  id: z.string(),
  walletId: z.string(),
  name: z.string(),
  currency: z.enum(CURRENCIES),
  targetCents: z.number().int().positive(),
  targetDate: isoDate.optional(),
  createdAt: z.string(),
});

/** Creating a goal also creates its wallet, so the input carries wallet fields too. */
export const createGoalInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60, "Name is too long"),
  currency: z.enum(CURRENCIES),
  targetCents: z.number().int().positive("Enter a target amount greater than zero"),
  targetDate: isoDate.optional(),
});

/** Predefined budget categories, in dropdown order. */
export const BUDGET_CATEGORIES = [
  { value: "groceries", label: "Groceries" },
  { value: "dining", label: "Dining out" },
  { value: "housing", label: "Rent & housing" },
  { value: "utilities", label: "Utilities & bills" },
  { value: "transport", label: "Transportation" },
  { value: "health", label: "Health" },
  { value: "education", label: "Education" },
  { value: "entertainment", label: "Entertainment" },
  { value: "shopping", label: "Shopping" },
  { value: "subscriptions", label: "Subscriptions" },
  { value: "travel", label: "Travel" },
  { value: "gifts", label: "Gifts & donations" },
  { value: "personal", label: "Personal" },
  { value: "other", label: "Other" },
] as const;

export type BudgetCategory = (typeof BUDGET_CATEGORIES)[number]["value"];

const budgetCategoryEnum = z.enum(
  BUDGET_CATEGORIES.map((item) => item.value) as [BudgetCategory, ...BudgetCategory[]]
);

export const budgetCategoryLabel = (category: BudgetCategory): string =>
  BUDGET_CATEGORIES.find((item) => item.value === category)?.label ?? category;

/** A monthly spending limit: withdrawals in `currency` count against it. */
export const budgetSchema = z.object({
  id: z.string(),
  /** Optional label. Budgets saved before categories existed have a name and no category. */
  name: z.string().trim().max(60).optional(),
  category: budgetCategoryEnum.optional(),
  currency: z.enum(CURRENCIES),
  /** Minor units (cents) allowed per calendar month. */
  limitCents: z.number().int().positive(),
  createdAt: z.string(),
});

export const createBudgetInputSchema = z.object({
  name: z.string().trim().max(60, "Name is too long").optional(),
  category: budgetCategoryEnum,
  currency: z.enum(CURRENCIES),
  limitCents: z.number().int().positive("Enter a monthly limit greater than zero"),
});

export type Budget = z.infer<typeof budgetSchema>;

/** What to call a budget: its label if it has one, otherwise its category. */
export const budgetTitle = (budget: Pick<Budget, "name" | "category">): string =>
  budget.name || (budget.category ? budgetCategoryLabel(budget.category) : "Budget");
export type CreateBudgetInput = z.infer<typeof createBudgetInputSchema>;
export type Wallet = z.infer<typeof walletSchema>;
export type GoalRecord = z.infer<typeof goalRecordSchema>;
export type Goal = z.infer<typeof goalSchema>;
export type CreateGoalInput = z.infer<typeof createGoalInputSchema>;
export type CreateWalletInput = z.infer<typeof createWalletInputSchema>;
export type TransactionType = z.infer<typeof transactionTypeSchema>;
export type Transaction = z.infer<typeof transactionSchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionInputSchema>;
export type CreateTransferInput = z.infer<typeof createTransferInputSchema>;
