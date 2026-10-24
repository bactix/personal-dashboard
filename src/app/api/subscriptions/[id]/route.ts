import { removeSubscription, updateSubscription } from "@/features/subscriptions/server"
import { createSubscriptionInputSchema } from "@/features/subscriptions/types"
import { deleteResponse } from "@/lib/api/delete-route"
import { updateResponse } from "@/lib/api/update-route"

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return deleteResponse("api/subscriptions DELETE", () => removeSubscription(id))
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return updateResponse({
    tag: "api/subscriptions PUT",
    request,
    schema: createSubscriptionInputSchema,
    update: (input) => updateSubscription(id, input),
  })
}
