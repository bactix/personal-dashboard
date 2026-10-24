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

const createdDay = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "long", year: "numeric" });

/**
 * Creation date as dd-mmmm-yyyy (e.g. "23-October-2026") in the viewer's local time, from a
 * record's `createdAt` ISO timestamp. Returns "—" for a missing or unreadable value.
 */
export function formatCreatedDate(iso: string | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    createdDay.formatToParts(date).find((item) => item.type === type)?.value ?? "";
  return `${part("day")}-${part("month")}-${part("year")}`;
}
