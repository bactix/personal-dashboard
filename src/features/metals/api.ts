import { http } from "@/lib/http/client";

import { metalPricesSchema, type MetalPrices } from "./types";

export function fetchMetalPrices(): Promise<MetalPrices> {
  return http("/api/metals", metalPricesSchema);
}
