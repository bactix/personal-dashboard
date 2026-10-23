/** Formats `now` in an IANA zone: 24h time plus a short weekday. Falls back to "—" for unknown zones. */
export function formatZoneTime(now: number, timeZone: string): { time: string; day: string } {
  try {
    const date = new Date(now)
    return {
      time: new Intl.DateTimeFormat("en-GB", {
        timeZone,
        hour: "2-digit",
        minute: "2-digit",
      }).format(date),
      day: new Intl.DateTimeFormat("en", { timeZone, weekday: "short" }).format(date),
    }
  } catch {
    return { time: "—", day: "" }
  }
}

/** Long date in an IANA zone, e.g. "Thursday, 22 October". Empty for unknown zones. */
export function formatZoneDate(now: number, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone,
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(new Date(now))
  } catch {
    return ""
  }
}
