import type { ReactNode } from "react";
import { addDays, format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

import {
  getRunsLeaderboard,
  isDayKey,
  istDay,
  istDayRange,
  type RunsLeaderboard,
} from "@/modules/strava/leaderboard";
import { formatKm, formatPace } from "@/modules/strava/run-score";

import { StatGroup, type Stat } from "@/components/dashboard/StatGroup";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { DayPicker } from "./DayPicker";
import { RunScoreCalculator } from "./RunScoreCalculator";
import { RunScoreInfo } from "./RunScoreInfo";

// One page for admins (/admin/runs) and members (/runs). Everyone in the org
// sees it: connecting Strava means agreeing to that (ADR 0002).

type Props = {
  organizationId: string;
  basePath: string;
  day?: string; // ?day=YYYY-MM-DD, today if missing or in the future
  viewerId?: string; // their row is marked "You"
  notice?: ReactNode; // shown above the board
};

function initials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function istTime(date: Date) {
  return format(toZonedTime(date, "Asia/Kolkata"), "h:mm a");
}

export async function RunsLeaderboardView({
  organizationId,
  basePath,
  day: requested,
  viewerId,
  notice,
}: Props) {
  const today = istDay();
  const day = isDayKey(requested) && requested <= today ? requested : today;
  const leaderboard = await getRunsLeaderboard(organizationId, day);

  const { start } = istDayRange(day);
  const previous = istDay(addDays(start, -1));
  const next = day < today ? istDay(addDays(start, 1)) : null;

  return (
    <div className='space-y-3 px-4'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='mb-3'>
          <h1 className='text-2xl font-heading tracking-wide'>Runs Leaderboard</h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            Further and faster runs on Strava score higher. The top runner in
            each window sits out the spin.
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <RunScoreCalculator />
          <DayPicker basePath={basePath} day={day} previous={previous} next={next} />
        </div>
      </div>

      {notice}

      <RunsLeaderboardBody
        leaderboard={leaderboard}
        isToday={day === today}
        viewerId={viewerId}
      />
    </div>
  );
}

/** The day's numbers and the table, apart from fetching. */
export function RunsLeaderboardBody({
  leaderboard,
  isToday,
  viewerId,
}: {
  leaderboard: RunsLeaderboard;
  isToday: boolean;
  viewerId?: string;
}) {
  const { entries, lockedAt } = leaderboard;
  // start is IST midnight as a UTC instant; the server runs in UTC
  const date = format(
    toZonedTime(istDayRange(leaderboard.day).start, "Asia/Kolkata"),
    "EEEE, d MMM yyyy",
  );
  const status = lockedAt
    ? `Locked at ${istTime(lockedAt)}`
    : isToday
      ? "Live until the first spin"
      : "No spin that day";

  const top = entries.filter((entry) => entry.rank === 1);
  const mine = viewerId
    ? entries.find((entry) => entry.userId === viewerId)
    : undefined;

  const stats: Stat[] = [
    {
      label: "Runners",
      value: String(entries.length),
      note: "with a scoring run",
    },
    {
      label: "Top score",
      value: top[0] ? top[0].score.toFixed(2) : "–",
      note: top.length > 0 ? top.map((entry) => entry.name).join(", ") : "nobody yet",
      dim: top.length === 0,
    },
    viewerId
      ? {
          label: "Your score",
          value: mine ? mine.score.toFixed(2) : "–",
          note: mine ? `#${mine.rank} of ${entries.length}` : "no scoring run",
          dim: !mine,
        }
      : {
          label: "First spin",
          value: lockedAt ? istTime(lockedAt) : "–",
          note: lockedAt
            ? "the board locked then"
            : isToday
              ? "not yet, the board is live"
              : "none that day",
          dim: !lockedAt,
        },
  ];

  return (
    <>
      <StatGroup title={`${date} · ${status}`} stats={stats} />

      <Card size='sm'>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
          <CardDescription>
            Ranked by run score. Equal scores share a rank.
          </CardDescription>
          <CardAction>
            <RunScoreInfo label='How scoring works' />
          </CardAction>
        </CardHeader>

        <CardContent>
          {entries.length === 0 ? (
            <p className='py-6 text-center text-sm text-muted-foreground'>
              Nobody had a scoring run{isToday ? " yet today" : " this day"}.
              Everyone in a window can be drawn.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-10'>#</TableHead>
                  <TableHead>Runner</TableHead>
                  <TableHead className='text-right'>Distance</TableHead>
                  <TableHead className='text-right'>Pace</TableHead>
                  <TableHead className='text-right'>Run score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => {
                  const isViewer = entry.userId === viewerId;
                  return (
                    <TableRow
                      key={entry.userId}
                      className={cn(isViewer && "bg-muted/60")}
                    >
                      <TableCell className='font-semibold tabular-nums'>
                        {entry.rank}
                      </TableCell>
                      <TableCell>
                        <div className='flex min-w-0 items-center gap-3'>
                          <Avatar>
                            {entry.photoUrl && (
                              <AvatarImage src={entry.photoUrl} alt='' />
                            )}
                            <AvatarFallback>{initials(entry.name)}</AvatarFallback>
                          </Avatar>
                          <span className='truncate font-medium'>{entry.name}</span>
                          {entry.rank === 1 && <Tag>Top runner</Tag>}
                          {isViewer && <Tag>You</Tag>}
                        </div>
                      </TableCell>
                      <TableCell className='text-right tabular-nums'>
                        {formatKm(entry.distance)}
                      </TableCell>
                      <TableCell className='text-right tabular-nums text-muted-foreground'>
                        {formatPace(entry.distance, entry.movingTime)}
                      </TableCell>
                      <TableCell className='text-right font-semibold tabular-nums'>
                        {entry.score.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>

        <CardFooter className='border-t text-xs text-muted-foreground'>
          {lockedAt
            ? `Locked at the first spin, ${istTime(lockedAt)}. Runs after that don't change this board.`
            : isToday
              ? "Locks at today's first spin. Runs after that don't change today's board."
              : "No spin this day, so nobody sat out."}
        </CardFooter>
      </Card>
    </>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className='shrink-0 text-[10px] font-semibold uppercase tracking-widest text-primary'>
      {children}
    </span>
  );
}
