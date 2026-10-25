import { paySubscription, SubscriptionPaymentError } from "@/features/subscriptions/server"
import { paySubscriptionInputSchema } from "@/features/subscriptions/types"
import { InsufficientFundsError, WalletNotFoundError } from "@/features/wallets/server"
import { updateResponse } from "@/lib/api/update-route"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return updateResponse({
    tag: "api/subscriptions pay",
    request,
    schema: paySubscriptionInputSchema,
    update: (input) => paySubscription(id, input),
    clientErrors: [SubscriptionPaymentError, WalletNotFoundError, InsufficientFundsError],
  })
}
