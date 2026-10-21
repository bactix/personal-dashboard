import type { Asset } from "./types";

/** Current value minus purchase price, in cents (negative = lost value). */
export function changeCents(asset: Pick<Asset, "purchaseCents" | "currentValueCents">): number {
  return asset.currentValueCents - asset.purchaseCents;
}

/** Change as a whole-number percent of the purchase price. */
export function changePercent(asset: Pick<Asset, "purchaseCents" | "currentValueCents">): number {
  return Math.round((changeCents(asset) / asset.purchaseCents) * 100);
}
