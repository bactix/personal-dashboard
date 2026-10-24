import { z } from "zod";

export const MAX_CONTENT_LENGTH = 5000;

export const STASH_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "in-progress", label: "In progress" },
  { value: "done", label: "Done" },
] as const;

export type StashStatus = (typeof STASH_STATUSES)[number]["value"];

export const stashStatusLabel = (status: StashStatus): string =>
  STASH_STATUSES.find((item) => item.value === status)?.label ?? status;

/** True when the whole text is a single web link, so it can be shown as one. */
export function isHttpUrl(value: string): boolean {
  if (/\s/.test(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const fields = {
  title: z.string().trim().min(1, "Title is required").max(120, "Title is too long"),
  /** A link or any text worth keeping for later. */
  content: z
    .string()
    .trim()
    .min(1, "Add a link or some text to stash")
    .max(MAX_CONTENT_LENGTH, `Too long (max ${MAX_CONTENT_LENGTH} characters)`),
  status: z.enum(STASH_STATUSES.map((item) => item.value) as [StashStatus, ...StashStatus[]]),
};

export const stashSchema = z.object({
  id: z.string(),
  ...fields,
  createdAt: z.string(),
});

export const createStashInputSchema = z.object(fields);

export type StashItem = z.infer<typeof stashSchema>;
export type CreateStashInput = z.infer<typeof createStashInputSchema>;
