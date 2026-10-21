import { z } from "zod";

export const loginInputSchema = z.object({
  password: z.string().min(1, "Enter your password").max(200),
});

export const okSchema = z.object({ ok: z.literal(true) });

export type LoginInput = z.infer<typeof loginInputSchema>;
