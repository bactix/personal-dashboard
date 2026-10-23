import { z } from "zod";

import { http } from "@/lib/http/client";
import { httpDelete } from "@/lib/http/delete";

import { cityMatchSchema, timezoneSchema, type CityMatch, type CreateTimezoneInput, type Timezone } from "./types";

export function fetchTimezones(): Promise<Timezone[]> {
  return http("/api/timezones", z.array(timezoneSchema));
}

export function postTimezone(input: CreateTimezoneInput): Promise<Timezone> {
  return http("/api/timezones", timezoneSchema, { method: "POST", json: input });
}

export function putTimezone(id: string, input: CreateTimezoneInput): Promise<Timezone> {
  return http(`/api/timezones/${encodeURIComponent(id)}`, timezoneSchema, { method: "PUT", json: input });
}

export function deleteTimezone(id: string): Promise<void> {
  return httpDelete(`/api/timezones/${encodeURIComponent(id)}`);
}

export function fetchCityMatches(query: string): Promise<CityMatch[]> {
  return http("/api/timezones/search", z.array(cityMatchSchema), { params: { q: query } });
}
