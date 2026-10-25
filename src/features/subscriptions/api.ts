import { z } from "zod";

import { http } from "@/lib/http/client";
import { httpDelete } from "@/lib/http/delete";

import {
  subscriptionPaymentSchema,
  subscriptionSchema,
  type CreateSubscriptionInput,
  type PaySubscriptionInput,
  type Subscription,
  type SubscriptionPayment,
} from "./types";

export function fetchSubscriptionPayments(): Promise<SubscriptionPayment[]> {
  return http("/api/subscriptions/payments", z.array(subscriptionPaymentSchema));
}

export function paySubscription(id: string, input: PaySubscriptionInput): Promise<SubscriptionPayment> {
  return http(`/api/subscriptions/${encodeURIComponent(id)}/pay`, subscriptionPaymentSchema, {
    method: "POST",
    json: input,
  });
}

export function fetchSubscriptions(): Promise<Subscription[]> {
  return http("/api/subscriptions", z.array(subscriptionSchema));
}

export function postSubscription(input: CreateSubscriptionInput): Promise<Subscription> {
  return http("/api/subscriptions", subscriptionSchema, { method: "POST", json: input });
}

export function putSubscription(id: string, input: CreateSubscriptionInput): Promise<Subscription> {
  return http(`/api/subscriptions/${encodeURIComponent(id)}`, subscriptionSchema, { method: "PUT", json: input });
}

export function deleteSubscription(id: string): Promise<void> {
  return httpDelete(`/api/subscriptions/${encodeURIComponent(id)}`);
}
