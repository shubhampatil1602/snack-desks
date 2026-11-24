import type { ActivityStatus } from "@/modules/strava/queries";

// The word shown beside an activity, coloured like order statuses on the
// dashboard. A plain module so server and client components can both use it.
export const ACTIVITY_STATUS: Record<
  ActivityStatus,
  { label: string; className: string }
> = {
  scores: { label: "Counts", className: "text-green-700 dark:text-green-400" },
  "after-spin": {
    label: "After the spin",
    className: "text-amber-700 dark:text-amber-300",
  },
  "too-slow": { label: "Too slow to score", className: "text-muted-foreground" },
  manual: { label: "Typed in", className: "text-muted-foreground" },
  "not-a-run": { label: "Not a run", className: "text-muted-foreground" },
};

/** 390 → "6:30 am" */
export function formatMinute(minute: number) {
  const hours = Math.floor(minute / 60);
  const minutes = minute % 60;
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${hours < 12 ? "am" : "pm"}`;
}

/** 1129 → "18:49" */
export function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = String(seconds % 60).padStart(2, "0");
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${rest}`
    : `${minutes}:${rest}`;
}
