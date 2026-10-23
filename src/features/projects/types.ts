import { z } from "zod";

import { withDefaultStart } from "@/lib/dates";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date");

export const MAX_RESOURCES = 20;

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** A link attached to a project (repo, design file, docs, …). */
export const resourceSchema = z.object({
  /** Optional label; the link's host is shown when empty. */
  title: z.string().trim().max(80, "Link title is too long").optional(),
  url: z
    .string()
    .trim()
    .max(500, "Link is too long")
    .refine(isHttpUrl, "Enter a full link, e.g. https://example.com"),
});

export type Resource = z.infer<typeof resourceSchema>;

/** What to show for a link: its title, else its host. */
export function resourceLabel(resource: Resource): string {
  if (resource.title) return resource.title;
  try {
    return new URL(resource.url).hostname.replace(/^www\./, "");
  } catch {
    return resource.url;
  }
}

const projectFields = {
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
  /** Links to the project's resources. Projects saved before this existed have none. */
  resources: z.array(resourceSchema).max(MAX_RESOURCES, `At most ${MAX_RESOURCES} links`).default([]),
  /** Optional: a project can have neither, either, or both dates. */
  startDate: isoDate.optional(),
  endDate: isoDate.optional(),
};

/** When both dates are set, the end can't come before the start. */
const endNotBeforeStart = {
  message: "End date can't be before the start date",
  path: ["endDate"],
};
const datesInOrder = (project: { startDate?: string; endDate?: string }) =>
  !project.startDate || !project.endDate || project.endDate >= project.startDate;

/** A project without a start date starts on the day it was created. */
export const projectSchema = z.preprocess(
  withDefaultStart,
  z
    .object({ id: z.string(), ...projectFields, createdAt: z.string() })
    .refine(datesInOrder, endNotBeforeStart)
);

export const createProjectInputSchema = z.object(projectFields).refine(datesInOrder, endNotBeforeStart);

export type Project = z.infer<typeof projectSchema>;
export type CreateProjectInput = z.infer<typeof createProjectInputSchema>;
