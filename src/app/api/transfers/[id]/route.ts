import { removeTransfer } from "@/features/wallets/server"
import { deleteResponse } from "@/lib/api/delete-route"

// `id` is the transfer id shared by both sides of the transfer.
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return deleteResponse("api/transfers DELETE", () => removeTransfer(id))
}
