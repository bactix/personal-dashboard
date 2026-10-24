import { PaymentError, payDebt } from "@/features/debts/server"
import { payDebtInputSchema } from "@/features/debts/types"
import { InsufficientFundsError, WalletNotFoundError } from "@/features/wallets/server"
import { updateResponse } from "@/lib/api/update-route"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return updateResponse({
    tag: "api/debts pay",
    request,
    schema: payDebtInputSchema,
    update: (input) => payDebt(id, input),
    clientErrors: [PaymentError, WalletNotFoundError, InsufficientFundsError],
  })
}
