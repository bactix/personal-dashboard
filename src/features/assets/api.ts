import { z } from "zod";

import { http } from "@/lib/http/client";
import { httpDelete } from "@/lib/http/delete";

import { assetSchema, type Asset, type CreateAssetInput } from "./types";

export function fetchAssets(): Promise<Asset[]> {
  return http("/api/assets", z.array(assetSchema));
}

export function postAsset(input: CreateAssetInput): Promise<Asset> {
  return http("/api/assets", assetSchema, { method: "POST", json: input });
}

export function putAsset(id: string, input: CreateAssetInput): Promise<Asset> {
  return http(`/api/assets/${encodeURIComponent(id)}`, assetSchema, { method: "PUT", json: input });
}

export function deleteAsset(id: string): Promise<void> {
  return httpDelete(`/api/assets/${encodeURIComponent(id)}`);
}
