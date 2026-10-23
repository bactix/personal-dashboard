/** The reference zone: all input is entered as Lebanon time. */
export const LEBANON_ZONE = "Asia/Beirut"

/** Parts of a wall-clock time in a zone, as numbers. */
function zoneParts(ms: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).formatToParts(new Date(ms))
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value)
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute") }
}

/** Offset of `timeZone` from UTC at an instant, in minutes (e.g. Beirut in summer = 180). */
export function zoneOffsetMinutes(ms: number, timeZone: string): number {
  const p = zoneParts(ms, timeZone)
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute)
  return Math.round((asUtc - Math.floor(ms / 60_000) * 60_000) / 60_000)
}

/** "yyyy-mm-ddThh:mm" (the `datetime-local` format) for an instant, as seen in a zone. */
export function toLocalInputValue(ms: number, timeZone: string): string {
  const p = zoneParts(ms, timeZone)
  const two = (n: number) => String(n).padStart(2, "0")
  return `${p.year}-${two(p.month)}-${two(p.day)}T${two(p.hour)}:${two(p.minute)}`
}

/**
 * The instant at which a zone's wall clock reads `value` ("yyyy-mm-ddThh:mm").
 * Returns null for an unparsable value. Handles daylight-saving offsets.
 */
export function fromLocalInputValue(value: string, timeZone: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value)
  if (!match) return null
  const [year, month, day, hour, minute] = match.slice(1).map(Number)
  const asUtc = Date.UTC(year, month - 1, day, hour, minute)
  if (Number.isNaN(asUtc)) return null

  // The offset depends on the instant itself, so refine once around the first guess.
  const first = asUtc - zoneOffsetMinutes(asUtc, timeZone) * 60_000
  return asUtc - zoneOffsetMinutes(first, timeZone) * 60_000
}

export type Comparison = {
  /** e.g. "Thu, 22 Oct 2026" */
  date: string
  /** 24-hour "HH:mm" */
  time: string
  /** Hours from Lebanon, e.g. "+1h", "-7h 30m", "same time". */
  difference: string
  /** Whether the date is the same day, the day before or the day after Lebanon's. */
  day: "same day" | "previous day" | "next day"
}

function formatDifference(minutes: number): string {
  if (minutes === 0) return "same time"
  const sign = minutes > 0 ? "+" : "-"
  const abs = Math.abs(minutes)
  const hours = Math.floor(abs / 60)
  const rest = abs % 60
  return `${sign}${hours}h${rest ? ` ${rest}m` : ""}`
}

/** What a Lebanon instant looks like in another zone, relative to Lebanon. */
export function compareInstant(ms: number, timeZone: string): Comparison {
  const date = new Date(ms)
  const here = zoneParts(ms, timeZone)
  const lebanon = zoneParts(ms, LEBANON_ZONE)
  const dayKey = (p: typeof here) => Date.UTC(p.year, p.month - 1, p.day)
  const dayDiff = Math.round((dayKey(here) - dayKey(lebanon)) / 86_400_000)

  return {
    date: new Intl.DateTimeFormat("en-GB", {
      timeZone,
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date),
    time: new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hourCycle: "h23",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date),
    difference: formatDifference(zoneOffsetMinutes(ms, timeZone) - zoneOffsetMinutes(ms, LEBANON_ZONE)),
    day: dayDiff === 0 ? "same day" : dayDiff < 0 ? "previous day" : "next day",
  }
}
