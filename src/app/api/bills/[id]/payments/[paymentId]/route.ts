import { removeBillPayment } from "@/features/accounting/server"
import { deleteResponse } from "@/lib/api/delete-route"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  const { id, paymentId } = await params
  return deleteResponse("api/bills/payments DELETE", () => removeBillPayment(id, paymentId))
}
