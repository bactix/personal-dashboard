import { z } from "zod";

import { http } from "@/lib/http/client";
import { httpDelete } from "@/lib/http/delete";

import { projectSchema, type CreateProjectInput, type Project } from "./types";

export function fetchProjects(): Promise<Project[]> {
  return http("/api/projects", z.array(projectSchema));
}

export function postProject(input: CreateProjectInput): Promise<Project> {
  return http("/api/projects", projectSchema, { method: "POST", json: input });
}

export function deleteProject(id: string): Promise<void> {
  return httpDelete(`/api/projects/${encodeURIComponent(id)}`);
}

export function putProject(id: string, input: CreateProjectInput): Promise<Project> {
  return http(`/api/projects/${encodeURIComponent(id)}`, projectSchema, { method: "PUT", json: input });
}
