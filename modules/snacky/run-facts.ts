import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

import { prisma } from "@/lib/db";
import { parsePeriod } from "@/lib/date-utils";
import {
  istDay,
  istDayRange,
  type RunsLeaderboard,
} from "@/modules/strava/leaderboard";
import { formatPace, isScoringRun, scoreDay } from "@/modules/strava/run-score";

// Strava numbers for Snacky's roasts, as plain fact lines. They are worked
// out here, never by the model.

type ActivityRow = {
  userId: string;
  startDate: Date;
  sportType: string;
  manual: boolean;
  distance: number;
  movingTime: number;
};

const ACTIVITY_SELECT = {
  userId: true,
  startDate: true,
  sportType: true,
  manual: true,
  distance: true,
  movingTime: true,
} as const;

const km = (metres: number, digits = 1) => `${(metres / 1000).toFixed(digits)} km`;
const firstName = (name: string) => name.split(" ")[0] || name;
const time = (date: Date) => format(toZonedTime(date, "Asia/Kolkata"), "h:mm a");
const dayLabel = (day: string, pattern = "d MMM") =>
  format(toZonedTime(istDayRange(day).start, "Asia/Kolkata"), pattern);

// A genuinely fast run earns Snacky's respect instead of a roast: 2 km in
// 7 minutes, 5 km in 25 or 10 km in an hour, with the bar sliding in between
// (3:30/km at 2 km, 5:00/km at 5 km, 6:00/km at 10 km and beyond).
const FAST_BARS = [
  { km: 2, pace: 210 },
  { km: 5, pace: 300 },
  { km: 10, pace: 360 },
];

export const FAST_RULE =
  "Genuinely fast means 2 km in 7 minutes (3:30/km), 5 km in 25 minutes (5:00/km) or 10 km in an hour (6:00/km), with the bar sliding in between; under 2 km never counts";

/** The slowest pace (s/km) that still counts as genuinely fast at this distance, or null under 2 km. */
function fastBar(kms: number) {
  if (kms < FAST_BARS[0].km) return null;
  for (let i = 1; i < FAST_BARS.length; i++) {
    const [low, high] = [FAST_BARS[i - 1], FAST_BARS[i]];
    if (kms <= high.km) {
      return low.pace + ((kms - low.km) / (high.km - low.km)) * (high.pace - low.pace);
    }
  }
  return FAST_BARS[FAST_BARS.length - 1].pace;
}

export function isGenuinelyFast(distance: number, movingTime: number) {
  const kms = distance / 1000;
  const bar = fastBar(kms);
  return bar !== null && movingTime / kms <= bar;
}

/** 1622 → "27:02" */
function clock(seconds: number) {
  const m = Math.floor(seconds / 60);
  return `${m}:${String(Math.round(seconds % 60)).padStart(2, "0")}`;
}

// a walk, or a Run slower than 12:00/km (CONTEXT.md)
function isWalk(activity: ActivityRow) {
  if (activity.sportType === "Walk" || activity.sportType === "Hike") return true;
  return activity.sportType === "Run" && !activity.manual && !isScoringRun(activity);
}

function periodWhere(period: string) {
  const { startDate, endDate } = parsePeriod(period);
  if (!startDate || !endDate) return { activities: {}, days: {} };
  return {
    activities: { startDate: { gte: startDate, lte: endDate } },
    days: { day: { gte: istDay(startDate), lte: istDay(endDate) } },
  };
}

/** How many days each person topped the board frozen at that day's spin. */
async function spinTops(organizationId: string, days: object) {
  const entries = await prisma.runsLeaderboardEntry.findMany({
    where: { organizationId, ...days },
    select: { day: true, userId: true, score: true },
  });
  const best = new Map<string, number>();
  for (const entry of entries) {
    best.set(entry.day, Math.max(best.get(entry.day) ?? 0, entry.score));
  }
  const tops = new Map<string, number>();
  for (const entry of entries) {
    if (entry.score > 0 && entry.score === best.get(entry.day)) {
      tops.set(entry.userId, (tops.get(entry.userId) ?? 0) + 1);
    }
  }
  return tops;
}

/** The best day's score among these activities: per person per IST day, all runs added up. */
function bestDay(rows: ActivityRow[]) {
  const groups = new Map<string, ActivityRow[]>();
  for (const row of rows) {
    const key = `${row.userId}|${istDay(row.startDate)}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  let best: { userId: string; day: string; score: number } | null = null;
  for (const [key, list] of groups) {
    const score = scoreDay(list)?.score ?? 0;
    if (score > (best?.score ?? 0)) {
      const [userId, day] = key.split("|");
      best = { userId, day, score };
    }
  }
  return best;
}

const sum = (rows: ActivityRow[], key: "distance" | "movingTime") =>
  rows.reduce((total, row) => total + row[key], 0);

/** One person's own running in the period, for their private dashboard roast. */
export async function personalRunFacts(
  organizationId: string,
  userId: string,
  period: string,
): Promise<{ lines: string[]; runs: number }> {
  const connected = await prisma.stravaConnection.findUnique({
    where: { userId },
    select: { userId: true },
  });
  if (!connected) return { lines: [], runs: 0 };

  const where = periodWhere(period);
  const [rows, tops] = await Promise.all([
    prisma.stravaActivity.findMany({
      where: { userId, ...where.activities },
      select: ACTIVITY_SELECT,
    }),
    spinTops(organizationId, where.days),
  ]);
  const runs = rows.filter(isScoringRun);
  const walks = rows.filter(isWalk);
  if (runs.length === 0 && walks.length === 0) return { lines: [], runs: 0 };

  const best = bestDay(runs);
  const longest = Math.max(0, ...runs.map((run) => run.distance));
  const fast = runs.filter((run) => isGenuinelyFast(run.distance, run.movingTime));
  const fastest = [...fast].sort((a, b) => b.distance - a.distance)[0];
  const lines = [
    runs.length > 0 &&
      `Their Strava runs: ${runs.length}, ${km(sum(runs, "distance"))} in all at ${formatPace(sum(runs, "distance"), sum(runs, "movingTime"))} on average; longest ${km(longest, 2)}`,
    best && `Their best day's run score: ${best.score.toFixed(2)} on ${dayLabel(best.day)}`,
    tops.has(userId) &&
      `Days they topped the office runs board at the spin, so they sat out the split master draw: ${tops.get(userId)}`,
    walks.length > 0 && `Their walks: ${walks.length}, ${km(sum(walks, "distance"))}`,
    fastest
      ? `Genuinely fast runs (${FAST_RULE}): ${fast.length}, the longest ${km(fastest.distance, 2)} in ${clock(fastest.movingTime)}`
      : `Genuinely fast runs (${FAST_RULE}): none`,
  ].filter((line): line is string => typeof line === "string");

  return { lines, runs: runs.length };
}

/** The office's running in the period, for the admin's dashboard roast. */
export async function orgRunFacts(organizationId: string, period: string) {
  const where = periodWhere(period);
  const [rows, tops] = await Promise.all([
    prisma.stravaActivity.findMany({
      where: {
        connection: { user: { members: { some: { organizationId } } } },
        ...where.activities,
      },
      select: {
        ...ACTIVITY_SELECT,
        connection: { select: { user: { select: { name: true } } } },
      },
    }),
    spinTops(organizationId, where.days),
  ]);
  const runs = rows.filter(isScoringRun);
  if (runs.length === 0) return [];

  const names = new Map(rows.map((row) => [row.userId, firstName(row.connection.user.name)]));
  const kmByPerson = new Map<string, number>();
  for (const run of runs) {
    kmByPerson.set(run.userId, (kmByPerson.get(run.userId) ?? 0) + run.distance);
  }
  const mostKm = [...kmByPerson].sort((a, b) => b[1] - a[1]).slice(0, 3);
  const mostTops = [...tops].sort((a, b) => b[1] - a[1])[0];
  const best = bestDay(runs);

  return [
    `Office running on Strava: ${kmByPerson.size} runners, ${runs.length} runs, ${km(sum(runs, "distance"))} in all`,
    `Most km run: ${mostKm.map(([userId, metres]) => `${names.get(userId)} ${km(metres)}`).join(", ")}`,
    best &&
      `Best single day's run score: ${names.get(best.userId)} ${best.score.toFixed(2)} on ${dayLabel(best.day)}`,
    mostTops &&
      names.has(mostTops[0]) &&
      `Most days on top of the runs board at the spin (sat out the split master draw): ${names.get(mostTops[0])} ${mostTops[1]}`,
  ].filter((line): line is string => typeof line === "string");
}

/** Changes whenever the day's board does, so a saved roast can tell it is out of date. */
export function boardKey(board: RunsLeaderboard) {
  return [
    board.lockedAt ? "locked" : "live",
    ...board.entries.map(
      (entry) => `${entry.userId}:${entry.score.toFixed(2)}:${Math.round(entry.distance)}`,
    ),
  ].join(",");
}

/** One day's runs leaderboard, for the roast on the leaderboard page. */
export function dayBoardFacts(board: RunsLeaderboard) {
  const { lockedAt } = board;
  const entries = board.entries.filter((entry) => entry.rank !== null);
  const slow = board.entries.filter((entry) => entry.rank === null);
  const isToday = board.day === istDay();
  return [
    `Day: ${dayLabel(board.day, "EEEE d MMM")}${isToday ? " (today)" : ""}`,
    lockedAt
      ? `The board locked at the day's first spin at ${time(lockedAt)}, so it is final`
      : isToday
        ? "The board is live until the day's first spin; more runs may still come"
        : "There was no spin that day, so nobody sat out",
    entries.length === 0
      ? "Nobody scored: every run was slower than 12:00/km"
      : `The board, best first: ${entries
          .map(
            (entry) =>
              `#${entry.rank} ${firstName(entry.name)} ${entry.score.toFixed(2)} points (${km(entry.distance, 2)} in ${clock(entry.movingTime)}, ${formatPace(entry.distance, entry.movingTime)})${isGenuinelyFast(entry.distance, entry.movingTime) ? ", GENUINELY FAST" : ""}`,
          )
          .join("; ")}`,
    slow.length > 0 &&
      `On the board but too slow to score (slower than 12:00/km, so it counts as a walk and scores 0): ${slow
        .map(
          (entry) =>
            `${firstName(entry.name)} (${km(entry.distance, 2)} in ${clock(entry.movingTime)}, ${formatPace(entry.distance, entry.movingTime)})`,
        )
        .join("; ")}`,
    `${FAST_RULE}. ${
      entries.some((entry) => isGenuinelyFast(entry.distance, entry.movingTime))
        ? "Runners marked GENUINELY FAST earned it"
        : "Nobody ran genuinely fast today"
    }`,
    entries.length > 1 &&
      `Gap between first and second: ${(entries[0].score - entries[1].score).toFixed(2)}`,
    "The top runner sits out the spin in every window they join, so they can't be split master and pay the shop",
  ].filter((line): line is string => typeof line === "string");
}
