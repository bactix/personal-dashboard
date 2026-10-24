import { z } from "zod";

import { http } from "@/lib/http/client";
import { httpDelete } from "@/lib/http/delete";

import { debtSchema, type CreateDebtInput, type Debt, type PayDebtInput } from "./types";

export function fetchDebts(): Promise<Debt[]> {
  return http("/api/debts", z.array(debtSchema));
}

export function postDebt(input: CreateDebtInput): Promise<Debt> {
  return http("/api/debts", debtSchema, { method: "POST", json: input });
}

export function deleteDebt(id: string): Promise<void> {
  return httpDelete(`/api/debts/${encodeURIComponent(id)}`);
}

export function putDebt(id: string, input: CreateDebtInput): Promise<Debt> {
  return http(`/api/debts/${encodeURIComponent(id)}`, debtSchema, { method: "PUT", json: input });
}

export function payDebt(id: string, input: PayDebtInput): Promise<Debt> {
  return http(`/api/debts/${encodeURIComponent(id)}/pay`, debtSchema, { method: "POST", json: input });
}
