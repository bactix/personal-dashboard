import { getProject } from "@/features/projects/server";
import { createJsonStore } from "@/lib/storage/json-store";

import { taskSchema, type CreateTaskInput, type Task } from "./types";

// Server-only: persistence for tasks. Used by app/api/tasks.

const store = createJsonStore("tasks", taskSchema);

export class ProjectNotFoundError extends Error {
  constructor() {
    super("Project not found");
    this.name = "ProjectNotFoundError";
  }
}

/** Soonest end date first, tasks without one last; ties broken by creation time. */
export async function listTasks(): Promise<Task[]> {
  const tasks = await store.list();
  return tasks.sort(
    (a, b) =>
      (a.endDate ?? "9999-99-99").localeCompare(b.endDate ?? "9999-99-99") ||
      a.createdAt.localeCompare(b.createdAt)
  );
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  if (input.projectId && !(await getProject(input.projectId))) throw new ProjectNotFoundError();
  return store.create(input);
}

export function removeTask(id: string): Promise<boolean> {
  return store.remove(id);
}

export async function updateTask(id: string, input: CreateTaskInput): Promise<Task | undefined> {
  if (input.projectId && !(await getProject(input.projectId))) throw new ProjectNotFoundError();
  return store.update(id, input);
}
