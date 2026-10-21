import { getContact } from "@/features/contacts/server";
import { createJsonStore } from "@/lib/storage/json-store";

import { debtSchema, type CreateDebtInput, type Debt } from "./types";

// Server-only: persistence for debts. Used by app/api/debts.

const store = createJsonStore("debts", debtSchema);

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
