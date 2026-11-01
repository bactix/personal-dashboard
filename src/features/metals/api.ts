import { http } from "@/lib/http/client";

import { metalHistorySchema, metalPricesSchema, type MetalHistory, type MetalPrices } from "./types";

export function fetchMetalPrices(): Promise<MetalPrices> {
  return http("/api/metals", metalPricesSchema);
}

export function fetchMetalHistory(): Promise<MetalHistory> {
  return http("/api/metals/history", metalHistorySchema);
}
