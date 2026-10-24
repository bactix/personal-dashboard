import { createSupabaseStore } from "@/lib/storage/supabase-store";

import { projectSchema, type CreateProjectInput, type Project } from "./types";

// Server-only: persistence for projects. Used by app/api/projects.

const store = createSupabaseStore({
  table: "projects",
  schema: projectSchema,
  exclude: ["resources"],
  children: [
    {
      table: "project_resources",
      fk: "project_id",
      columns: "title,url,position",
      order: "position",
      attach(candidate, rows) {
        candidate.resources = rows
          .sort((a, b) => Number(a.position) - Number(b.position))
          // The database requires a title; a link saved without one is stored as "".
          .map((row) => ({ title: row.title ? String(row.title) : undefined, url: row.url }));
      },
      toRows: (input) =>
        input.resources.map((resource, position) => ({
          title: resource.title ?? "",
          url: resource.url,
          position,
        })),
    },
  ],
});

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
