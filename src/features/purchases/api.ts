import { z } from "zod";

import { http } from "@/lib/http/client";
import { httpDelete } from "@/lib/http/delete";

import {
  purchaseItemSchema,
  type CreatePurchaseItemInput,
  type PurchaseItem,
} from "./types";

export function fetchPurchaseItems(): Promise<PurchaseItem[]> {
  return http("/api/purchases", z.array(purchaseItemSchema));
}

export function postPurchaseItem(input: CreatePurchaseItemInput): Promise<PurchaseItem> {
  return http("/api/purchases", purchaseItemSchema, { method: "POST", json: input });
}

export function deletePurchaseItem(id: string): Promise<void> {
  return httpDelete(`/api/purchases/${encodeURIComponent(id)}`);
}

export function putPurchaseItem(id: string, input: CreatePurchaseItemInput): Promise<PurchaseItem> {
  return http(`/api/purchases/${encodeURIComponent(id)}`, purchaseItemSchema, { method: "PUT", json: input });
}
