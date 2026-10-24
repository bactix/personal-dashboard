import { formatMoney } from "@/lib/money";

import type { AppNotification } from "./types";

// Pure builders: turn already-loaded data into notifications. No fetching, no clock reads;
// `today` (yyyy-mm-dd) and `now` are passed in so these stay deterministic.

/** Items due within this many days (today included) count as "due soon". */
export const DUE_SOON_DAYS = 3;
/** A prayer notification shows from this many minutes before the time until this many after. */
const PRAYER_WINDOW_MINUTES = 30;

const DAY_MS = 86_400_000;

/** Whole days from `from` to `to` (both yyyy-mm-dd); negative when `to` is earlier. */
function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);
}

function dueLabel(days: number): string {
  if (days < 0) return `${-days} day${days === -1 ? "" : "s"} overdue`;
  if (days === 0) return "due today";
  return days === 1 ? "due tomorrow" : `due in ${days} days`;
}

/**
 * Overdue / due-soon notification for anything with a due date, or null when it's not yet
 * relevant. The id changes when the state changes (soon → overdue), so a dismissed
 * "due soon" doesn't hide the later "overdue".
 */
function dueNotification(
  base: { key: string; title: string; detail: string; href: string; kind: AppNotification["kind"] },
  dueDate: string,
  today: string
): AppNotification | null {
  const days = daysBetween(today, dueDate);
  if (days > DUE_SOON_DAYS) return null;
  const overdue = days < 0;
  return {
    id: `${base.key}:${overdue ? "overdue" : "soon"}`,
    kind: base.kind,
    severity: overdue ? "overdue" : "soon",
    title: `${base.title} ${dueLabel(days)}`,
    detail: base.detail,
    href: base.href,
    sortKey: days,
  };
}

type InvoiceLike = {
  id: string;
  number: string;
  customer: string;
  currency: string;
  status: string;
  dueDate: string;
};

export function invoiceNotifications(
  invoices: (InvoiceLike & { outstandingCents: number })[],
  today: string
): AppNotification[] {
  return invoices.flatMap((invoice) => {
    // Drafts aren't sent yet; paid or fully-settled invoices have nothing outstanding.
    if (invoice.status !== "sent" || invoice.outstandingCents <= 0) return [];
    const item = dueNotification(
      {
        key: `invoice:${invoice.id}`,
        kind: "invoice",
        title: `Invoice ${invoice.number}`,
        detail: `${invoice.customer} · ${formatMoney(invoice.outstandingCents, invoice.currency)} to collect`,
        href: "/financial/invoices",
      },
      invoice.dueDate,
      today
    );
    return item ? [item] : [];
  });
}

type BillLike = {
  id: string;
  vendor: string;
  currency: string;
  status: string;
  dueDate: string;
};

export function billNotifications(
  bills: (BillLike & { outstandingCents: number })[],
  today: string
): AppNotification[] {
  return bills.flatMap((bill) => {
    if (bill.status !== "unpaid" || bill.outstandingCents <= 0) return [];
    const item = dueNotification(
      {
        key: `bill:${bill.id}`,
        kind: "bill",
        title: `Bill from ${bill.vendor}`,
        detail: `${formatMoney(bill.outstandingCents, bill.currency)} to pay`,
        href: "/financial/vendor-bills",
      },
      bill.dueDate,
      today
    );
    return item ? [item] : [];
  });
}

export function taskNotifications(
  tasks: { id: string; name: string; endDate?: string }[],
  today: string
): AppNotification[] {
  return tasks.flatMap((task) => {
    if (!task.endDate) return [];
    const item = dueNotification(
      { key: `task:${task.id}`, kind: "task", title: `Task “${task.name}”`, detail: "Tasks", href: "/work/tasks" },
      task.endDate,
      today
    );
    return item ? [item] : [];
  });
}

export function projectNotifications(
  projects: { id: string; name: string; endDate?: string }[],
  today: string
): AppNotification[] {
  return projects.flatMap((project) => {
    if (!project.endDate) return [];
    const item = dueNotification(
      {
        key: `project:${project.id}`,
        kind: "project",
        title: `Project “${project.name}”`,
        detail: "Projects",
        href: "/work/projects",
      },
      project.endDate,
      today
    );
    return item ? [item] : [];
  });
}

/** Active subscriptions renewing within the next few days. `nextRenewal` is already worked out. */
export function subscriptionNotifications(
  subscriptions: {
    id: string
    name: string
    amountCents: number
    currency: string
    cycle: string
    status: string
    nextRenewal: string
  }[],
  today: string
): AppNotification[] {
  return subscriptions.flatMap((subscription) => {
    if (subscription.status !== "active") return [];
    // The renewal date is part of the id, so dismissing this charge doesn't hide the next one.
    const item = dueNotification(
      {
        key: `subscription:${subscription.id}:${subscription.nextRenewal}`,
        kind: "subscription",
        title: `Subscription “${subscription.name}”`,
        detail: `${formatMoney(subscription.amountCents, subscription.currency)} · ${subscription.cycle}`,
        href: "/financial/subscriptions",
      },
      subscription.nextRenewal,
      today
    );
    return item ? [item] : [];
  });
}

function minutesOf(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Prayers starting soon or that just started. `nowMinutes` is the current Lebanon time as
 * minutes since midnight (prayer times are Lebanon local time). Sunrise isn't a prayer.
 */
export function prayerNotifications(
  prayerTimes: { date: string; prayers: { key: string; label: string; time: string }[] } | undefined,
  nowMinutes: number
): AppNotification[] {
  if (!prayerTimes) return [];
  return prayerTimes.prayers.flatMap((prayer) => {
    if (prayer.key === "sunrise") return [];
    const away = minutesOf(prayer.time) - nowMinutes; // > 0: upcoming, <= 0: already started
    if (away > PRAYER_WINDOW_MINUTES || away < -PRAYER_WINDOW_MINUTES) return [];
    const started = away <= 0;
    return [
      {
        id: `prayer:${prayerTimes.date}:${prayer.key}:${started ? "now" : "soon"}`,
        kind: "prayer" as const,
        severity: "info" as const,
        title: started ? `${prayer.label} time has started` : `${prayer.label} in ${away} min`,
        detail: `${prayer.time} · Lebanon time`,
        href: "/personal/azkar",
        sortKey: away,
      },
    ];
  });
}
