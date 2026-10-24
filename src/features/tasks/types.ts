import { z } from "zod";

import { withDefaultStart } from "@/lib/dates";

/** Fixed categories for tasks that don't belong to a project. */
export const TASK_CATEGORIES = [
  { value: "learning", label: "Learning" },
  { value: "work", label: "Work" },
  { value: "deen", label: "Deen" },
  { value: "thoughts", label: "Thoughts" },
] as const;

export type TaskCategory = (typeof TASK_CATEGORIES)[number]["value"];

export const taskCategoryLabel = (category: TaskCategory): string =>
  TASK_CATEGORIES.find((item) => item.value === category)?.label ?? category;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date");

const fields = {
  name: z.string().trim().min(1, "Name is required").max(150, "Name is too long"),
  /** What the task involves. Optional, so tasks saved before this existed still load. */
  description: z.string().trim().max(2000, "Description is too long").optional(),
  /** Day the task starts (yyyy-mm-dd). Defaults to the day it was created. */
  startDate: isoDate.optional(),
  /** Optional end day (yyyy-mm-dd). Tasks without one are listed after dated tasks. */
  endDate: isoDate.optional(),
  /** Optional link to a project (see features/projects). */
  projectId: z.string().min(1).optional(),
  /** Only for tasks without a project. */
  category: z.enum(TASK_CATEGORIES.map((item) => item.value) as [TaskCategory, ...TaskCategory[]]).optional(),
};

/** When both dates are set, the end can't come before the start. */
const endNotBeforeStart = {
  message: "End date can't be before the start date",
  path: ["endDate"],
};
const datesInOrder = (task: { startDate?: string; endDate?: string }) =>
  !task.startDate || !task.endDate || task.endDate >= task.startDate;

/** Stored tasks from before start/end dates used `deadline` for what is now `endDate`. */
function migrateLegacy(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const record = raw as Record<string, unknown>;
  if (!("deadline" in record)) return raw;
  const { deadline, ...rest } = record;
  return { ...rest, endDate: rest.endDate ?? deadline };
}

/** A task without a start date starts on the day it was created. */
export const taskSchema = z.preprocess(
  (raw) => withDefaultStart(migrateLegacy(raw)),
  z
    .object({
      id: z.string(),
      ...fields,
      /** ISO timestamp set by the server when the task is created. */
      createdAt: z.string(),
    })
    .refine(datesInOrder, endNotBeforeStart)
);

export const createTaskInputSchema = z
  .object(fields)
  .refine(datesInOrder, endNotBeforeStart)
  .refine((task) => !(task.projectId && task.category), {
    message: "A task with a project can't also have a category",
    path: ["category"],
  });

export type Task = z.infer<typeof taskSchema>;
export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;
