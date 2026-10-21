import { z } from "zod";

import { http } from "@/lib/http/client";
import { httpDelete } from "@/lib/http/delete";

import { contactSchema, type Contact, type CreateContactInput } from "./types";

export function fetchContacts(): Promise<Contact[]> {
  return http("/api/contacts", z.array(contactSchema));
}

export function postContact(input: CreateContactInput): Promise<Contact> {
  return http("/api/contacts", contactSchema, { method: "POST", json: input });
}

export function deleteContact(id: string): Promise<void> {
  return httpDelete(`/api/contacts/${encodeURIComponent(id)}`);
}

export function putContact(id: string, input: CreateContactInput): Promise<Contact> {
  return http(`/api/contacts/${encodeURIComponent(id)}`, contactSchema, { method: "PUT", json: input });
}
