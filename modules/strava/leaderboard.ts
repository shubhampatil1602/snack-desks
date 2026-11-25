import { addDays } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { boardDay } from "@/modules/strava/run-score";
import { importActivitiesSince } from "@/modules/strava/sync";

// The Runs Leaderboard (CONTEXT.md): an org's Strava-connected members
// ordered by the day's run score. Anyone who recorded a Run shows; runs
// slower than 12:00/km score 0 and sit unranked at the bottom. It's live until the org's first spin of the
// day, which locks it for every window that day (ADR 0003).
//
// Not cached: Strava's webhook changes activities outside server actions.

const TIME_ZONE = "Asia/Kolkata";

/** The IST calendar day, as YYYY-MM-DD. */
export function istDay(date: Date = new Date()) {
  return formatInTimeZone(date, TIME_ZONE, "yyyy-MM-dd");
}

export function isDayKey(value: string | undefined): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** UTC instants for the start and end of an IST day. */
export function istDayRange(day: string) {
  const start = fromZonedTime(`${day}T00:00:00`, TIME_ZONE);
  return { start, end: addDays(start, 1) };
}

export type RunsEntry = {
  userId: string;
  name: string;
  photoUrl: string | null;
  distance: number; // metres
  movingTime: number; // seconds
  score: number; // 0 when every run was too slow to score
  // equal scores share a rank; null when too slow to score
  rank: number | null;
};

export type RunsLeaderboard = {
  day: string;
  lockedAt: Date | null;
  entries: RunsEntry[];
};

function ranked(rows: Omit<RunsEntry, "rank">[]): RunsEntry[] {
  const sorted = [...rows].sort((a, b) => b.score - a.score || b.distance - a.distance);
  return sorted.map((row) => ({
    ...row,
    rank: row.score > 0 ? sorted.findIndex((other) => other.score === row.score) + 1 : null,
  }));
}

async function liveEntries(organizationId: string, day: string) {
  const { start, end } = istDayRange(day);
  const connections = await prisma.stravaConnection.findMany({
    where: { user: { members: { some: { organizationId } } } },
    select: {
      userId: true,
      photoUrl: true,
      user: { select: { name: true, image: true } },
      activities: {
        where: { startDate: { gte: start, lt: end } },
        select: { sportType: true, manual: true, distance: true, movingTime: true },
      },
    },
  });

  const rows = connections.flatMap((connection) => {
    const total = boardDay(connection.activities);
    if (!total) return [];
    return [
      {
        userId: connection.userId,
        name: connection.user.name,
        photoUrl: connection.photoUrl ?? connection.user.image,
        ...total,
      },
    ];
  });
  return ranked(rows);
}

export async function getRunsLeaderboard(
  organizationId: string,
  day: string = istDay(),
): Promise<RunsLeaderboard> {
  const lock = await prisma.runsLeaderboardLock.findUnique({
    where: { organizationId_day: { organizationId, day } },
    select: { lockedAt: true },
  });

  if (!lock) {
    return { day, lockedAt: null, entries: await liveEntries(organizationId, day) };
  }

  const rows = await prisma.runsLeaderboardEntry.findMany({
    where: { organizationId, day },
    select: {
      userId: true,
      distance: true,
      movingTime: true,
      score: true,
      user: {
        select: {
          name: true,
          image: true,
          stravaConnection: { select: { photoUrl: true } },
        },
      },
    },
  });

  return {
    day,
    lockedAt: lock.lockedAt,
    entries: ranked(
      rows.map((row) => ({
        userId: row.userId,
        name: row.user.name,
        photoUrl: row.user.stravaConnection?.photoUrl ?? row.user.image,
        distance: row.distance,
        movingTime: row.movingTime,
        score: row.score,
      })),
    ),
  };
}

/**
 * The day's leaderboard for the spin: locks it on the org's first spin of
 * that day, after pulling the day's runs from Strava in case a webhook was
 * missed.
 */
export async function lockRunsLeaderboard(organizationId: string, day: string) {
  const existing = await prisma.runsLeaderboardLock.findUnique({
    where: { organizationId_day: { organizationId, day } },
    select: { lockedAt: true },
  });
  if (existing) return getRunsLeaderboard(organizationId, day);

  const connected = await prisma.stravaConnection.findMany({
    where: { user: { members: { some: { organizationId } } } },
    select: { userId: true },
  });
  const { start } = istDayRange(day);
  await Promise.all(
    connected.map(({ userId }) => importActivitiesSince(userId, start)),
  );

  const entries = await liveEntries(organizationId, day);
  try {
    await prisma.$transaction([
      prisma.runsLeaderboardLock.create({ data: { organizationId, day } }),
      prisma.runsLeaderboardEntry.createMany({
        data: entries.map((entry) => ({
          organizationId,
          day,
          userId: entry.userId,
          distance: entry.distance,
          movingTime: entry.movingTime,
          score: entry.score,
        })),
      }),
    ]);
  } catch (e) {
    // two spins at once: the other one locked it first
    if (
      !(e instanceof Prisma.PrismaClientKnownRequestError) ||
      e.code !== "P2002"
    ) {
      throw e;
    }
  }
  return getRunsLeaderboard(organizationId, day);
}

/**
 * The first day the office's board can show anything: its earliest stored
 * run or locked day, or today when there are none.
 */
export async function firstBoardDay(organizationId: string) {
  const [run, lock] = await Promise.all([
    prisma.stravaActivity.findFirst({
      where: { connection: { user: { members: { some: { organizationId } } } } },
      orderBy: { startDate: "asc" },
      select: { startDate: true },
    }),
    prisma.runsLeaderboardLock.findFirst({
      where: { organizationId },
      orderBy: { day: "asc" },
      select: { day: true },
    }),
  ]);
  const days = [run && istDay(run.startDate), lock?.day, istDay()].filter(
    (day): day is string => !!day,
  );
  return days.sort()[0];
}

/**
 * The Top Runner(s) among these people: the best score on the leaderboard,
 * all of them if tied. Empty when none of them ran.
 */
export function topRunnerIds(leaderboard: RunsLeaderboard, peopleIds: string[]) {
  const present = leaderboard.entries.filter(
    (entry) => entry.score > 0 && peopleIds.includes(entry.userId),
  );
  if (present.length === 0) return [];
  const best = Math.max(...present.map((entry) => entry.score));
  return present.filter((entry) => entry.score === best).map((e) => e.userId);
}
