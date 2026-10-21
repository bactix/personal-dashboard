import { z } from "zod";

import { CURRENCIES } from "@/lib/money";

/** "i-owe": a debt on me (I owe the contact). "owed-to-me": a debt on the contact (they owe me). */
export const debtDirectionSchema = z.enum(["i-owe", "owed-to-me"]);

export const debtSchema = z.object({
  id: z.string(),
  direction: debtDirectionSchema,
  contactId: z.string().min(1),
  /** Minor units (cents) to avoid floating-point errors when summing. */
  amountCents: z.number().int().positive(),
  currency: z.enum(CURRENCIES),
  description: z.string().max(200).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  createdAt: z.string(),
});

export const createDebtInputSchema = debtSchema.omit({ id: true, createdAt: true });

export type DebtDirection = z.infer<typeof debtDirectionSchema>;
export type Debt = z.infer<typeof debtSchema>;
export type CreateDebtInput = z.infer<typeof createDebtInputSchema>;
