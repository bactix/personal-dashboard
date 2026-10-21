/** Local calendar day (yyyy-mm-dd) of an ISO timestamp. */
export function localDay(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA");
}

/**
 * For `z.preprocess` on a stored record: a missing `startDate` becomes the day the record was
 * created (`createdAt`). New records get it when they are saved; older ones get it when read.
 */
export function withDefaultStart(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const record = raw as Record<string, unknown>;
  if (record.startDate || typeof record.createdAt !== "string") return raw;
  return { ...record, startDate: localDay(record.createdAt) };
}
