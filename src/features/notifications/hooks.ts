import { useMemo } from "react";

import {
  billOutstandingCents,
  invoiceOutstandingCents,
  useBills,
  useInvoices,
} from "@/features/accounting";
import { usePrayerTimes } from "@/features/prayer-times";
import { useProjects } from "@/features/projects";
import { nextRenewal, useSubscriptions } from "@/features/subscriptions";
import { useTasks } from "@/features/tasks";
import { useNow } from "@/hooks/use-now";
import { useToday } from "@/hooks/use-today";

import {
  billNotifications,
  invoiceNotifications,
  prayerNotifications,
  projectNotifications,
  subscriptionNotifications,
  taskNotifications,
} from "./build";
import { useDismissed } from "./dismissed";
import type { AppNotification, NotificationSeverity } from "./types";

const cycleText = (cycle: string) => cycle.charAt(0).toUpperCase() + cycle.slice(1);

const SEVERITY_ORDER: Record<NotificationSeverity, number> = { overdue: 0, soon: 1, info: 2 };

const lebanonClock = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Beirut",
  hourCycle: "h23",
  hour: "2-digit",
  minute: "2-digit",
});

/** Current Lebanon time as minutes since midnight. */
function lebanonMinutes(now: number): number {
  const [hours, minutes] = lebanonClock.format(new Date(now)).split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Everything that needs attention, built from the other features' queries (a query that
 * fails or is still loading simply contributes nothing). Dismissed items are filtered out.
 */
export function useNotifications() {
  const today = useToday();
  const now = useNow();
  const invoices = useInvoices().data;
  const bills = useBills().data;
  const tasks = useTasks().data;
  const projects = useProjects().data;
  const prayerTimes = usePrayerTimes().data;
  const subscriptions = useSubscriptions().data;
  const dismissed = useDismissed();

  const all = useMemo<AppNotification[]>(() => {
    if (!today || now === null) return [];
    return [
      ...invoiceNotifications(
        (invoices ?? []).map((invoice) => ({ ...invoice, outstandingCents: invoiceOutstandingCents(invoice) })),
        today
      ),
      ...billNotifications(
        (bills ?? []).map((bill) => ({ ...bill, outstandingCents: billOutstandingCents(bill) })),
        today
      ),
      ...taskNotifications(tasks ?? [], today),
      ...projectNotifications(projects ?? [], today),
      ...subscriptionNotifications(
        (subscriptions ?? []).map((subscription) => ({
          ...subscription,
          cycle: cycleText(subscription.cycle),
          nextRenewal: nextRenewal(subscription.startDate, subscription.cycle, today),
        })),
        today
      ),
      ...prayerNotifications(prayerTimes, lebanonMinutes(now)),
    ].sort(
      (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || a.sortKey - b.sortKey
    );
  }, [today, now, invoices, bills, tasks, projects, prayerTimes, subscriptions]);

  const items = all.filter((item) => !dismissed.isDismissed(item.id));

  return {
    items,
    dismiss: (id: string) => dismissed.dismiss([id]),
    dismissAll: () => dismissed.dismiss(items.map((item) => item.id)),
  };
}
