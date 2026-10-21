import type { Project } from "./types";

export type ProjectStatus = {
  label: "Upcoming" | "In progress" | "Finished" | "No dates";
  variant: "outline" | "default" | "secondary";
};

/**
 * Status from the dates relative to `today` (yyyy-mm-dd). Either date may be missing:
 * a project with only a start is in progress once it starts; with only an end, until it ends.
 */
export function statusOf(project: Pick<Project, "startDate" | "endDate">, today: string): ProjectStatus {
  const { startDate, endDate } = project;
  if (!startDate && !endDate) return { label: "No dates", variant: "secondary" };
  if (startDate && today < startDate) return { label: "Upcoming", variant: "outline" };
  if (endDate && today > endDate) return { label: "Finished", variant: "secondary" };
  return { label: "In progress", variant: "default" };
}
