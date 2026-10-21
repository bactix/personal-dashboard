import { z } from "zod";

import { http } from "@/lib/http/client";
import { httpDelete } from "@/lib/http/delete";

import { taskSchema, type CreateTaskInput, type Task } from "./types";

export function fetchTasks(): Promise<Task[]> {
  return http("/api/tasks", z.array(taskSchema));
}

export function postTask(input: CreateTaskInput): Promise<Task> {
  return http("/api/tasks", taskSchema, { method: "POST", json: input });
}

export function deleteTask(id: string): Promise<void> {
  return httpDelete(`/api/tasks/${encodeURIComponent(id)}`);
}

export function putTask(id: string, input: CreateTaskInput): Promise<Task> {
  return http(`/api/tasks/${encodeURIComponent(id)}`, taskSchema, { method: "PUT", json: input });
}
