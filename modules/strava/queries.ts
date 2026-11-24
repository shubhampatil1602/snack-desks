import { subDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

import { prisma } from "@/lib/db";
import { STRAVA_CAPACITY } from "@/lib/strava/api";
import {
  getRunsLeaderboard,
  istDay,
  istDayRange,
} from "@/modules/strava/leaderboard";
import { isScoringRun, scoreDay } from "@/modules/strava/run-score";

// Reads for the Strava page. Not cached: activities arrive by webhook,
// outside server actions (lib/cache-tags.ts).

// the training log covers this many days, today included; connecting imports
// the same 90 days (app/api/strava/callback)
export const LOG_DAYS = 90;
const RECENT_COUNT = 5;

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

type ActivityRow = {
  sportType: string;
  manual: boolean;
  distance: number;
  movingTime: number;
  startDate: Date;
};

// same rules as the run score (CONTEXT.md): only scoring runs are runs, a Run
// slower than 11:30/km is a walk, and typed-in runs go under other
function kindOf(activity: ActivityRow): ActivityKind {
  if (isScoringRun(activity)) return "run";
  if (activity.sportType === "Run" && !activity.manual) return "walk";
  if (activity.sportType === "Walk" || activity.sportType === "Hike") return "walk";
  return "other";
}

// Why it is or isn't on the day's board. A scoring run after the org's first
// spin missed the frozen board, but it still counts for its day on this page.
export type ActivityStatus =
  | "scores"
  | "after-spin"
  | "too-slow"
  | "manual"
  | "not-a-run";

function statusOf(activity: ActivityRow, lockedAt: Date | null): ActivityStatus {
  if (isScoringRun(activity)) {
    return lockedAt && activity.startDate > lockedAt ? "after-spin" : "scores";
  }
  if (activity.sportType !== "Run") return "not-a-run";
  if (activity.manual) return "manual";
  return "too-slow";
}

/** Minutes after midnight in India, for the day timeline. */
function istMinute(date: Date) {
  const [hours, minutes] = formatInTimeZone(date, "Asia/Kolkata", "H:m")
    .split(":")
    .map(Number);
  return hours * 60 + minutes;
}

export type LogActivity = {
  id: string;
  name: string;
  sportType: string;
  kind: ActivityKind;
  day: string; // YYYY-MM-DD in IST
  startDate: Date;
  startMinute: number; // minutes after midnight IST
  distance: number; // metres
  movingTime: number; // seconds
  elapsedTime: number; // seconds
  status: ActivityStatus;
};

export type LogDay = {
  day: string; // YYYY-MM-DD in IST
  activities: LogActivity[]; // oldest first
  runKm: number;
  runTime: number; // seconds
  walkKm: number;
  walkTime: number;
  // every scoring run that day, after the spin too
  score: number | null;
  scoringRuns: number;
  lockedAt: Date | null; // the org's first spin that day
  lockMinute: number | null;
  // their place that day: the board frozen at the spin, or, with no spin,
  // the same live ranking /runs shows for the day
  board: { score: number; rank: number; of: number; locked: boolean } | null;
};

type ScoreRow = { userId: string; score: number };

function placeOf(rows: ScoreRow[], userId: string) {
  const mine = rows.find((row) => row.userId === userId);
  if (!mine) return null;
  return {
    score: mine.score,
    rank: rows.filter((row) => row.score > mine.score).length + 1,
    of: rows.length,
  };
}

export async function getStravaOverview(userId: string, organizationId: string) {
  const connection = await prisma.stravaConnection.findUnique({
    where: { userId },
    select: { firstName: true, lastName: true, photoUrl: true, connectedAt: true },
  });
  if (!connection) return null;

  const today = istDay();
  const firstDay = istDay(subDays(new Date(), LOG_DAYS - 1));
  const { start } = istDayRange(firstDay);

  const [rows, locks, entries, orgRows, leaderboard] = await Promise.all([
    prisma.stravaActivity.findMany({
      where: { userId, startDate: { gte: start } },
      orderBy: { startDate: "asc" },
      select: {
        id: true,
        name: true,
        sportType: true,
        startDate: true,
        distance: true,
        movingTime: true,
        elapsedTime: true,
        manual: true,
      },
    }),
    prisma.runsLeaderboardLock.findMany({
      where: { organizationId, day: { gte: firstDay } },
      select: { day: true, lockedAt: true },
    }),
    prisma.runsLeaderboardEntry.findMany({
      where: { organizationId, day: { gte: firstDay } },
      select: { day: true, userId: true, score: true },
    }),
    // everyone's runs in the org, to rank the days without a spin
    prisma.stravaActivity.findMany({
      where: {
        startDate: { gte: start },
        connection: { user: { members: { some: { organizationId } } } },
      },
      select: {
        userId: true,
        sportType: true,
        startDate: true,
        distance: true,
        movingTime: true,
        manual: true,
      },
    }),
    getRunsLeaderboard(organizationId, today),
  ]);

  const lockByDay = new Map(locks.map((lock) => [lock.day, lock.lockedAt]));

  const frozenByDay = new Map<string, ScoreRow[]>();
  for (const entry of entries) {
    frozenByDay.set(entry.day, [...(frozenByDay.get(entry.day) ?? []), entry]);
  }

  // day → person → their activities, then each person's score for the day
  const orgByDay = new Map<string, Map<string, typeof orgRows>>();
  for (const row of orgRows) {
    const day = istDay(row.startDate);
    const people = orgByDay.get(day) ?? new Map<string, typeof orgRows>();
    people.set(row.userId, [...(people.get(row.userId) ?? []), row]);
    orgByDay.set(day, people);
  }
  const liveScores = (day: string): ScoreRow[] =>
    [...(orgByDay.get(day) ?? new Map<string, typeof orgRows>()).entries()].flatMap(
      ([person, list]) => {
        const total = scoreDay(list);
        return total ? [{ userId: person, score: total.score }] : [];
      },
    );

  const rowsByDay = new Map<string, typeof rows>();
  for (const row of rows) {
    const day = istDay(row.startDate);
    rowsByDay.set(day, [...(rowsByDay.get(day) ?? []), row]);
  }

  // days with activities or a spin, oldest first
  const dayKeys = [...new Set([...rowsByDay.keys(), ...lockByDay.keys()])].sort();
  const days: LogDay[] = dayKeys.map((day) => {
    const list = rowsByDay.get(day) ?? [];
    const lockedAt = lockByDay.get(day) ?? null;
    const activities: LogActivity[] = list.map((row) => ({
      id: row.id.toString(),
      name: row.name,
      sportType: row.sportType,
      kind: kindOf(row),
      day,
      startDate: row.startDate,
      startMinute: istMinute(row.startDate),
      distance: row.distance,
      movingTime: row.movingTime,
      elapsedTime: row.elapsedTime,
      status: statusOf(row, lockedAt),
    }));
    const sum = (kind: ActivityKind, key: "distance" | "movingTime") =>
      activities
        .filter((activity) => activity.kind === kind)
        .reduce((total, activity) => total + activity[key], 0);

    const place = lockedAt
      ? placeOf(frozenByDay.get(day) ?? [], userId)
      : placeOf(liveScores(day), userId);

    return {
      day,
      activities,
      runKm: sum("run", "distance") / 1000,
      runTime: sum("run", "movingTime"),
      walkKm: sum("walk", "distance") / 1000,
      walkTime: sum("walk", "movingTime"),
      score: scoreDay(list)?.score ?? null,
      scoringRuns: list.filter(isScoringRun).length,
      lockedAt,
      lockMinute: lockedAt ? istMinute(lockedAt) : null,
      board: place ? { ...place, locked: !!lockedAt } : null,
    };
  });

  const recent = days
    .flatMap((day) => day.activities)
    .slice(-RECENT_COUNT)
    .reverse();

  // their own entry and the count; the full list is on /runs (ADR 0002)
  const mine = leaderboard.entries.find((entry) => entry.userId === userId) ?? null;

  return {
    athlete: connection,
    today: {
      entry: mine,
      rankedCount: leaderboard.entries.length,
      lockedAt: leaderboard.lockedAt,
    },
    log: { firstDay, today, days },
    recent,
  };
}

export type StravaOverview = NonNullable<Awaited<ReturnType<typeof getStravaOverview>>>;
