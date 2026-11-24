import { subDays } from "date-fns";

import { prisma } from "@/lib/db";
import { STRAVA_CAPACITY } from "@/lib/strava/api";
import { getRunsLeaderboard, istDay } from "@/modules/strava/leaderboard";
import {
  isScoringRun,
  scoreDay,
} from "@/modules/strava/run-score";

// Reads for the Strava page. Not cached: activities arrive by webhook,
// outside server actions (lib/cache-tags.ts).

export const CHART_DAYS = 30;

/** Shown on the sidebar item: "Connect with Strava" or "Your Strava activity". */
export async function isStravaConnected(userId: string) {
  const connection = await prisma.stravaConnection.findUnique({
    where: { userId },
    select: { userId: true },
  });
  return !!connection;
}

export async function stravaSpotsLeft() {
  return Math.max(0, STRAVA_CAPACITY - (await prisma.stravaConnection.count()));
}

export type ActivityKind = "run" | "walk" | "other";

// same rules as the run score (CONTEXT.md): only scoring runs are runs, a Run
// slower than 11:30/km is a walk, and typed-in runs go under other
function kindOf(activity: {
  sportType: string;
  manual: boolean;
  distance: number;
  movingTime: number;
}): ActivityKind {
  if (isScoringRun(activity)) return "run";
  if (activity.sportType === "Run" && !activity.manual) return "walk";
  if (activity.sportType === "Walk" || activity.sportType === "Hike") return "walk";
  return "other";
}

export type ChartDay = {
  day: string; // YYYY-MM-DD
  label: string; // "23 Nov"
  run: number; // km
  walk: number;
  other: number;
  score: number | null;
};

export type RecentActivity = {
  id: string;
  name: string;
  sportType: string;
  startDate: Date;
  distance: number;
  movingTime: number;
  // why it does or doesn't score
  status: "scores" | "too-slow" | "manual" | "not-a-run";
};

function statusOf(activity: {
  sportType: string;
  manual: boolean;
  distance: number;
  movingTime: number;
}): RecentActivity["status"] {
  if (isScoringRun(activity)) return "scores";
  if (activity.sportType !== "Run") return "not-a-run";
  if (activity.manual) return "manual";
  return "too-slow";
}

export async function getStravaOverview(userId: string, organizationId: string) {
  const connection = await prisma.stravaConnection.findUnique({
    where: { userId },
    select: { firstName: true, lastName: true, photoUrl: true, connectedAt: true },
  });
  if (!connection) return null;

  const since = subDays(new Date(), CHART_DAYS);
  const [activities, leaderboard] = await Promise.all([
    prisma.stravaActivity.findMany({
      where: { userId, startDate: { gte: since } },
      orderBy: { startDate: "desc" },
      select: {
        id: true,
        name: true,
        sportType: true,
        startDate: true,
        distance: true,
        movingTime: true,
        manual: true,
      },
    }),
    getRunsLeaderboard(organizationId, istDay()),
  ]);

  // one bar per IST day, oldest first
  const days = new Map<string, ChartDay>();
  for (let i = CHART_DAYS - 1; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const day = istDay(date);
    days.set(day, {
      day,
      label: date.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" }),
      run: 0,
      walk: 0,
      other: 0,
      score: null,
    });
  }
  const byDay = new Map<string, typeof activities>();
  for (const activity of activities) {
    const day = istDay(activity.startDate);
    const bar = days.get(day);
    if (!bar) continue;
    bar[kindOf(activity)] += activity.distance / 1000;
    byDay.set(day, [...(byDay.get(day) ?? []), activity]);
  }
  for (const [day, list] of byDay) {
    const bar = days.get(day);
    if (bar) bar.score = scoreDay(list)?.score ?? null;
  }
  const chart = [...days.values()].map((bar) => ({
    ...bar,
    run: Math.round(bar.run * 100) / 100,
    walk: Math.round(bar.walk * 100) / 100,
    other: Math.round(bar.other * 100) / 100,
  }));

  const recent: RecentActivity[] = activities.slice(0, 15).map((activity) => ({
    id: activity.id.toString(),
    name: activity.name,
    sportType: activity.sportType,
    startDate: activity.startDate,
    distance: activity.distance,
    movingTime: activity.movingTime,
    status: statusOf(activity),
  }));

  const totals = activities.reduce(
    (sum, activity) => {
      const kind = kindOf(activity);
      if (kind === "run") sum.runs += 1;
      sum[`${kind}Km`] += activity.distance / 1000;
      return sum;
    },
    { runs: 0, runKm: 0, walkKm: 0, otherKm: 0 },
  );

  // their own entry and the count; the full list is on /runs (ADR 0002)
  const mine = leaderboard.entries.find((entry) => entry.userId === userId) ?? null;

  return {
    athlete: connection,
    today: {
      entry: mine,
      rankedCount: leaderboard.entries.length,
      lockedAt: leaderboard.lockedAt,
    },
    chart,
    recent,
    totals,
  };
}

export type StravaOverview = NonNullable<Awaited<ReturnType<typeof getStravaOverview>>>;
