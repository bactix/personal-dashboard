import { http } from "@/lib/http/client";

import { okSchema, type LoginInput } from "./types";

export function login(input: LoginInput) {
  return http("/api/auth/login", okSchema, { method: "POST", json: input });
}
