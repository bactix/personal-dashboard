import { z } from "zod";

import { http } from "./client";

const deletedSchema = z.object({ ok: z.literal(true) });

/** `DELETE <url>` against one of our own /api routes. */
export async function httpDelete(url: string): Promise<void> {
  await http(url, deletedSchema, { method: "DELETE" });
}
