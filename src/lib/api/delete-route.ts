import { NextResponse } from "next/server";

/** Thrown by a feature's `remove*` when other records still depend on the one being deleted. */
export class InUseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InUseError";
  }
}

/**
 * Shared body of every `DELETE /api/<x>/[id]` handler.
 * `remove` resolves to false when the record doesn't exist.
 */
export async function deleteResponse(
  tag: string,
  remove: () => Promise<boolean>
): Promise<NextResponse> {
  try {
    if (!(await remove())) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof InUseError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error(`[${tag}]`, error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
