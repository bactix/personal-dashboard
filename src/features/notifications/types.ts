export type NotificationKind = "invoice" | "bill" | "task" | "project" | "prayer" | "subscription";

/** `overdue` needs action now, `soon` is coming up, `info` is just a heads-up. */
export type NotificationSeverity = "overdue" | "soon" | "info";

/** One entry in the bell. Built from other features' data; never stored. */
export type AppNotification = {
  /** Stable while the situation is unchanged, so a dismissal sticks (see build.ts). */
  id: string;
  kind: NotificationKind;
  severity: NotificationSeverity;
  title: string;
  detail: string;
  /** Page that shows the underlying item. */
  href: string;
  /** Orders items within a severity: days until due (negative = overdue), or minutes to a prayer. */
  sortKey: number;
};
