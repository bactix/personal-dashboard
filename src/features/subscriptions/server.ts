import { createSupabaseStore } from "@/lib/storage/supabase-store";

import { subscriptionSchema, type CreateSubscriptionInput, type Subscription } from "./types";

// Server-only: persistence for subscriptions. Used by app/api/subscriptions.

const store = createSupabaseStore({ table: "subscriptions", schema: subscriptionSchema });

export async function listSubscriptions(): Promise<Subscription[]> {
  const items = await store.list();
  return items.sort((a, b) => a.name.localeCompare(b.name));
}

export function createSubscription(input: CreateSubscriptionInput): Promise<Subscription> {
  return store.create(input);
}

export function updateSubscription(
  id: string,
  input: CreateSubscriptionInput
): Promise<Subscription | undefined> {
  return store.update(id, input);
}

export function removeSubscription(id: string): Promise<boolean> {
  return store.remove(id);
}
