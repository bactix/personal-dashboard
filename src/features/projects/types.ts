import { z } from "zod";

import { withDefaultStart } from "@/lib/dates";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date");

const projectFields = {
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
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
