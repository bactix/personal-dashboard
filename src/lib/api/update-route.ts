import { NextResponse } from "next/server";
import type { z } from "zod";

import { InUseError } from "./delete-route";

type ClientErrorClass = new (...args: never[]) => Error;

/**
 * Shared body of every `PUT /api/<x>/[id]` handler: validates the body with the same
 * schema used for creation, runs `update`, and maps outcomes to HTTP statuses.
 *
 * - `update` resolves to undefined when the record doesn't exist -> 404.
 * - Errors listed in `clientErrors` (e.g. "contact not found") -> 400 with their message.
 * - `InUseError` -> 409.
 */
export async function updateResponse<S extends z.ZodType>(options: {
  tag: string;
  request: Request;
  schema: S;
  update: (input: z.output<S>) => Promise<unknown>;
  clientErrors?: ClientErrorClass[];
}): Promise<NextResponse> {
  const { tag, request, schema, update, clientErrors = [] } = options;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const updated = await update(parsed.data);
    if (updated === undefined) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof InUseError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (clientErrors.some((ErrorClass) => error instanceof ErrorClass)) {
      return NextResponse.json({ error: (error as Error).message }, { status: 400 });
    }
    console.error(`[${tag}]`, error);
    return NextResponse.json({ error: "Failed to save changes" }, { status: 500 });
  }
}
