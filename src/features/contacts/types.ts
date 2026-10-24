import { z } from "zod";

import { normalizePhone } from "@/lib/phone";

export const MAX_PHONES = 10;
export const MAX_EMAILS = 10;

/** Digits with optional leading "+", spaces, dashes and parentheses; at least 5 digits. */
const phoneSchema = z
  .string()
  .trim()
  .max(25, "Phone number is too long")
  .regex(/^\+?[\d\s\-()]+$/, "Enter a valid phone number")
  .refine((value) => value.replace(/\D/g, "").length >= 5, "Enter a valid phone number")
  // Saved with its country code (the default one is added when it's left out).
  .transform(normalizePhone);

const emailSchema = z.string().trim().max(120, "Email is too long").email("Enter a valid email address");

const storedContactSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(80),
  // Numbers saved before country codes were added get the default one when read.
  phones: z.array(z.string().max(40).transform(normalizePhone)).default([]),
  emails: z.array(z.string().max(120)).default([]),
  createdAt: z.string(),
});

/**
 * Contacts saved before multiple numbers existed carry a single optional `phone`;
 * it is read as a one-item `phones` list (and written back that way on the next save).
 */
export const contactSchema = z.preprocess((raw) => {
  if (raw && typeof raw === "object" && "phone" in raw && !("phones" in raw)) {
    const { phone, ...rest } = raw as { phone?: unknown }
    return { ...rest, phones: typeof phone === "string" && phone ? [phone] : [] }
  }
  return raw
}, storedContactSchema);

/** Only the name is required; phone numbers and emails are optional. */
export const createContactInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80, "Name is too long"),
  phones: z.array(phoneSchema).max(MAX_PHONES, `At most ${MAX_PHONES} phone numbers`).default([]),
  emails: z.array(emailSchema).max(MAX_EMAILS, `At most ${MAX_EMAILS} emails`).default([]),
});

export type Contact = z.infer<typeof storedContactSchema>;
export type CreateContactInput = z.infer<typeof createContactInputSchema>;
