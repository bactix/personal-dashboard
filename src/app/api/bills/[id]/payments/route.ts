import { addBillPayment, LimitExceededError } from "@/features/accounting/server"
import { createPaymentInputSchema } from "@/features/accounting/types"
import { updateResponse } from "@/lib/api/update-route"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return updateResponse({
    tag: "api/bills/payments POST",
    request,
    schema: createPaymentInputSchema,
    update: (input) => addBillPayment(id, input),
    clientErrors: [LimitExceededError],
  })
}
