import type { ReactNode } from "react";
import { addDays, format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

import {
  getRunsLeaderboard,
  isDayKey,
  istDay,
  istDayRange,
} from "@/modules/strava/leaderboard";
import { formatKm, formatPace } from "@/modules/strava/run-score";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { RunScoreInfo } from "./RunScoreInfo";

// One page for admins (/admin/runs) and members (/runs). Everyone in the org
// sees it: connecting Strava means agreeing to that (ADR 0002).

type Props = {
  organizationId: string;
  basePath: string;
  day?: string; // ?day=YYYY-MM-DD, today if missing or in the future
  viewerId?: string; // their row is marked "You"
  notice?: ReactNode; // shown above the table
};

function initials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
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
    <div className='space-y-6 px-4'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-heading'>Runs Leaderboard</h1>
          <p className='flex flex-wrap items-center gap-x-1 text-sm text-muted-foreground'>
            Ranked by run score: further and faster runs on Strava score
            higher. In each window, the best-ranked runner sits out the spin.
            <RunScoreInfo label='How scoring works' />
          </p>
        </div>
        <DayPicker basePath={basePath} day={day} previous={previous} next={next} />
      </div>

      <div className='flex flex-wrap items-center gap-2 text-sm'>
        <span className='font-medium'>
          {format(start, "EEEE, d MMM yyyy")}
        </span>
        {leaderboard.lockedAt ? (
          <Badge>
            Locked at{" "}
            {format(toZonedTime(leaderboard.lockedAt, "Asia/Kolkata"), "h:mm a")}
          </Badge>
        ) : day === today ? (
          <Badge variant='outline'>Live until the first spin</Badge>
        ) : (
          <Badge variant='outline'>No spin that day</Badge>
        )}
      </div>

      {notice}

      <Card size='sm'>
        <CardContent>
          {leaderboard.entries.length === 0 ? (
            <p className='py-8 text-center text-sm text-muted-foreground'>
              Nobody had a scoring run{day === today ? " yet today" : " this day"}.
              Everyone in a window can be drawn.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-12'>#</TableHead>
                  <TableHead>Runner</TableHead>
                  <TableHead className='text-right'>Distance</TableHead>
                  <TableHead className='text-right'>Pace</TableHead>
                  <TableHead className='text-right'>
                    <span className='inline-flex items-center gap-1'>
                      Run score
                      <RunScoreInfo />
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.entries.map((entry) => {
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
                        <div className='flex items-center gap-3'>
                          <Avatar size='sm'>
                            {entry.photoUrl && (
                              <AvatarImage src={entry.photoUrl} alt='' />
                            )}
                            <AvatarFallback>{initials(entry.name)}</AvatarFallback>
                          </Avatar>
                          <span className='font-medium'>{entry.name}</span>
                          {isViewer && <Badge variant='secondary'>You</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className='text-right tabular-nums'>
                        {formatKm(entry.distance)}
                      </TableCell>
                      <TableCell className='text-right tabular-nums'>
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
      </Card>
    </div>
  );
}
