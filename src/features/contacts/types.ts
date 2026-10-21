import { z } from "zod";

/** Digits with optional leading "+", spaces, dashes and parentheses; at least 5 digits. */
const phoneSchema = z
  .string()
  .trim()
  .max(25, "Phone number is too long")
  .regex(/^\+?[\d\s\-()]+$/, "Enter a valid phone number")
  .refine((value) => value.replace(/\D/g, "").length >= 5, "Enter a valid phone number");

export const contactSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(80),
  /** Optional only so contacts saved before phone numbers existed still load. */
  phone: z.string().max(25).optional(),
  createdAt: z.string(),
});

export const createContactInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80, "Name is too long"),
  phone: phoneSchema,
});

export type Contact = z.infer<typeof contactSchema>;
export type CreateContactInput = z.infer<typeof createContactInputSchema>;
