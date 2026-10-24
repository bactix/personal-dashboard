import { createSupabaseStore } from "@/lib/storage/supabase-store";

import { contactSchema, type Contact, type CreateContactInput } from "./types";

// Server-only: persistence for contacts. Used by app/api/contacts and (read-only) by debts.

/** Phones and emails are rows in their own tables, kept in the order they were entered. */
function listChild(valueColumn: string, key: "phones" | "emails") {
  return {
    columns: `${valueColumn},position`,
    order: "position",
    attach(candidate: Record<string, unknown>, rows: Record<string, unknown>[]) {
      candidate[key] = rows
        .sort((a, b) => Number(a.position) - Number(b.position))
        .map((row) => row[valueColumn]);
    },
    toRows: (input: CreateContactInput) =>
      // The database allows each number / email once per contact.
      [...new Set(input[key])].map((value, position) => ({ [valueColumn]: value, position })),
  };
}

const store = createSupabaseStore({
  table: "contacts",
  schema: contactSchema,
  exclude: ["phones", "emails"],
  children: [
    { table: "contact_phones", fk: "contact_id", ...listChild("phone", "phones") },
    { table: "contact_emails", fk: "contact_id", ...listChild("email", "emails") },
  ],
});

export async function listContacts(): Promise<Contact[]> {
  const contacts = await store.list();
  return contacts.sort((a, b) => a.name.localeCompare(b.name));
}

export function getContact(id: string): Promise<Contact | undefined> {
  return store.get(id);
}

export function createContact(input: CreateContactInput): Promise<Contact> {
  return store.create(input);
}

export function removeContact(id: string): Promise<boolean> {
  return store.remove(id);
}

export function updateContact(id: string, input: CreateContactInput): Promise<Contact | undefined> {
  return store.update(id, input);
}
