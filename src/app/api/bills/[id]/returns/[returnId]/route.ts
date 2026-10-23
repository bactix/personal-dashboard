import { removeBillReturn } from "@/features/accounting/server"
import { deleteResponse } from "@/lib/api/delete-route"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; returnId: string }> }
) {
  const { id, returnId } = await params
  return deleteResponse("api/bills/returns DELETE", () => removeBillReturn(id, returnId))
}
