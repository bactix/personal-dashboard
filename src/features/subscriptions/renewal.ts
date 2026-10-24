import type { Subscription, SubscriptionCycle } from "./types";

// Pure date and cost maths for subscriptions. Days are yyyy-mm-dd strings; everything is done in
// UTC so a local timezone or daylight-saving change can never shift a date.

const DAY_MS = 86_400_000;

function parse(day: string): { y: number; m: number; d: number } {
  const [y, m, d] = day.split("-").map(Number);
  return { y, m: m - 1, d };
}

const format = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

/** `start` plus whole months, clamped to the month's last day (Jan 31 + 1 month = Feb 28/29). */
function addMonths(start: string, months: number): string {
  const { y, m, d } = parse(start);
  const index = m + months;
  const year = y + Math.floor(index / 12);
  const month = ((index % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return format(Date.UTC(year, month, Math.min(d, lastDay)));
}

const MONTHS_PER_CYCLE: Record<Exclude<SubscriptionCycle, "weekly">, number> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
};

/**
 * The first charge date on or after `today`. Always counted from the start date (never from the
 * previous renewal), so a charge on the 31st doesn't drift to the 28th for good.
 */
export function nextRenewal(startDate: string, cycle: SubscriptionCycle, today: string): string {
  if (startDate >= today) return startDate;

  if (cycle === "weekly") {
    const gapDays = Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / DAY_MS);
    return format(Date.parse(`${startDate}T00:00:00Z`) + Math.ceil(gapDays / 7) * 7 * DAY_MS);
  }

  const step = MONTHS_PER_CYCLE[cycle];
  const from = parse(startDate);
  const to = parse(today);
  const monthsApart = (to.y - from.y) * 12 + (to.m - from.m);
  let cycles = Math.floor(monthsApart / step);
  while (addMonths(startDate, cycles * step) < today) cycles++;
  return addMonths(startDate, cycles * step);
}

/** Whole days from `from` to `to` (both yyyy-mm-dd); negative when `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);
}

const PER_YEAR: Record<SubscriptionCycle, number> = { weekly: 52, monthly: 12, quarterly: 4, yearly: 1 };

/** What the subscription costs over a year, in cents. */
export function yearlyCents(subscription: Pick<Subscription, "amountCents" | "cycle">): number {
  return subscription.amountCents * PER_YEAR[subscription.cycle];
}

/** The same cost spread over a month, in cents. */
export function monthlyCents(subscription: Pick<Subscription, "amountCents" | "cycle">): number {
  return Math.round(yearlyCents(subscription) / 12);
}
