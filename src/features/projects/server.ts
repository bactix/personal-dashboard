import { createJsonStore } from "@/lib/storage/json-store";

import { projectSchema, type CreateProjectInput, type Project } from "./types";

// Server-only: persistence for projects. Used by app/api/projects.

const store = createJsonStore("projects", projectSchema);

/** Most recent start date first; projects without a start date come last (newest first). */
export async function listProjects(): Promise<Project[]> {
  const projects = await store.list();
  return projects.sort((a, b) => {
    if (a.startDate && b.startDate) return b.startDate.localeCompare(a.startDate);
    if (a.startDate || b.startDate) return a.startDate ? -1 : 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function createProject(input: CreateProjectInput): Promise<Project> {
  return store.create(input);
}

export function getProject(id: string): Promise<Project | undefined> {
  return store.get(id);
}

export function removeProject(id: string): Promise<boolean> {
  return store.remove(id);
}

export function updateProject(id: string, input: CreateProjectInput): Promise<Project | undefined> {
  return store.update(id, input);
}
