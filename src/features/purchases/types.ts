import { z } from "zod";

/** Only web links; rejects javascript:, data:, etc. since the URL is rendered as an <a href>. */
const webUrlSchema = z
  .string()
  .max(2000)
  .refine((value) => {
    try {
      const { protocol } = new URL(value);
      return protocol === "http:" || protocol === "https:";
    } catch {
      return false;
    }
  }, "Enter a valid link starting with http:// or https://");

export const purchaseItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  url: webUrlSchema.optional(),
  note: z.string().max(200).optional(),
  createdAt: z.string(),
});

export const createPurchaseItemInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
  url: webUrlSchema.optional(),
  note: z.string().trim().max(200, "Note is too long").optional(),
});

export type PurchaseItem = z.infer<typeof purchaseItemSchema>;
export type CreatePurchaseItemInput = z.infer<typeof createPurchaseItemInputSchema>;
