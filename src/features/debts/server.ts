import { getContact } from "@/features/contacts/server";
import { createSupabaseStore } from "@/lib/storage/supabase-store";

import { debtSchema, type CreateDebtInput, type Debt } from "./types";

// Server-only: persistence for debts. Used by app/api/debts.

/** The database spells the directions with underscores; the app uses hyphens. */
const DIRECTION_TO_DB = { "i-owe": "i_owe", "owed-to-me": "owed_to_me" } as const;
const DIRECTION_FROM_DB = { i_owe: "i-owe", owed_to_me: "owed-to-me" } as const;

const store = createSupabaseStore({
  table: "debts",
  schema: debtSchema,
  readFix(candidate, raw) {
    candidate.direction = DIRECTION_FROM_DB[raw.direction as keyof typeof DIRECTION_FROM_DB];
  },
  writeFix(row, input) {
    row.direction = DIRECTION_TO_DB[input.direction];
  },
});

export class ContactNotFoundError extends Error {
  constructor() {
    super("Contact not found");
    this.name = "ContactNotFoundError";
  }
}

export async function listDebts(): Promise<Debt[]> {
  const debts = await store.list();
  return debts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createDebt(input: CreateDebtInput): Promise<Debt> {
  if (!(await getContact(input.contactId))) throw new ContactNotFoundError();
  return store.create(input);
}

export function removeDebt(id: string): Promise<boolean> {
  return store.remove(id);
}

export async function updateDebt(id: string, input: CreateDebtInput): Promise<Debt | undefined> {
  if (!(await getContact(input.contactId))) throw new ContactNotFoundError();
  return store.update(id, input);
}
