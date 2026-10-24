import { z } from "zod";

import { http } from "@/lib/http/client";
import { httpDelete } from "@/lib/http/delete";

import { stashSchema, type CreateStashInput, type StashItem } from "./types";

export function fetchStash(): Promise<StashItem[]> {
  return http("/api/stash", z.array(stashSchema));
}

export function postStashItem(input: CreateStashInput): Promise<StashItem> {
  return http("/api/stash", stashSchema, { method: "POST", json: input });
}

export function putStashItem(id: string, input: CreateStashInput): Promise<StashItem> {
  return http(`/api/stash/${encodeURIComponent(id)}`, stashSchema, { method: "PUT", json: input });
}

export function deleteStashItem(id: string): Promise<void> {
  return httpDelete(`/api/stash/${encodeURIComponent(id)}`);
}
