import { createJsonStore } from "@/lib/storage/json-store";

import { contactSchema, type Contact, type CreateContactInput } from "./types";

// Server-only: persistence for contacts. Used by app/api/contacts and (read-only) by debts.

const store = createJsonStore("contacts", contactSchema);

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
