import { z } from "zod";

/** One remembrance (dhikr). Static reference content, not user data. */
export const dhikrSchema = z.object({
  id: z.string(),
  arabic: z.string(),
  translation: z.string(),
  /** How many times to recite it. */
  repeat: z.number().int().positive(),
});

export type Dhikr = z.infer<typeof dhikrSchema>;
export type AzkarPeriod = "morning" | "evening";
