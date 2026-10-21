import { z } from "zod";

import { CURRENCIES } from "@/lib/money";

const assetFields = {
  name: z.string().trim().min(1, "Name is required").max(80, "Name is too long"),
  /** Free text, e.g. "Vehicle", "Electronics", "Property". */
  category: z.string().trim().max(40, "Category is too long").optional(),
  currency: z.enum(CURRENCIES),
  /** Day it was bought (yyyy-mm-dd). */
  purchaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid purchase date"),
  /** Minor units (cents) paid. */
  purchaseCents: z.number().int().positive("Enter the purchase price"),
  /** Minor units (cents) it is worth now; may be zero. */
  currentValueCents: z.number().int().nonnegative(),
  notes: z.string().trim().max(500, "Notes are too long").optional(),
};

export const assetSchema = z.object({ id: z.string(), ...assetFields, createdAt: z.string() });

export const createAssetInputSchema = z.object(assetFields);

export type Asset = z.infer<typeof assetSchema>;
export type CreateAssetInput = z.infer<typeof createAssetInputSchema>;
