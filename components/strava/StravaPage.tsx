import type { ReactNode } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

import { stravaConfigured } from "@/lib/strava/api";
import {
  getStravaOverview,
  stravaSpotsLeft,
  type RecentActivity,
  type StravaOverview,
} from "@/modules/strava/queries";
import { formatKm, formatPace } from "@/modules/strava/run-score";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConnectStravaForm } from "./ConnectStravaForm";
import { DisconnectStravaButton } from "./DisconnectStravaButton";
import { RunScoreInfo } from "./RunScoreInfo";
import { StravaDistanceChart, StravaScoreChart } from "./StravaCharts";

const ERRORS: Record<string, string> = {
  consent: "Tick the box to agree before connecting.",
  unavailable: "Strava isn't set up on this server yet.",
  full: "More spots coming soon. All Strava spots are taken for now.",
  expired: "That took too long. Try connecting again.",
  denied: "You cancelled on Strava, so nothing was connected.",
  scope:
    "Keep “View data about your private activities” ticked on Strava, so your private runs count too.",
  strava: "Strava didn't answer. Try again in a minute.",
  taken: "That Strava account is already connected to another SnackDesk user.",
};

function istTime(date: Date) {
  return format(toZonedTime(date, "Asia/Kolkata"), "h:mm a");
}

function istDate(date: Date) {
  return format(toZonedTime(date, "Asia/Kolkata"), "d MMM, h:mm a");
}

type Props = {
  userId: string;
  organizationId: string;
  error?: string;
  connected?: boolean;
};

export async function StravaPage({
  userId,
  organizationId,
  error,
  connected,
}: Props) {
  const overview = await getStravaOverview(userId, organizationId);

  return (
    <div className='space-y-3 px-3'>
      <div>
        <h1 className='text-2xl font-heading'>
          {overview ? "Your Strava activity" : "Connect with Strava"}
        </h1>
        <p className='text-sm text-muted-foreground'>
          The day&apos;s best runner in a window sits out its spin, so they
          won&apos;t be split master.
        </p>
      </div>

      {error && ERRORS[error] && (
        <p className='border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive'>
          {ERRORS[error]}
        </p>
      )}
      {connected && overview && (
        <p className='border border-border bg-muted px-4 py-3 text-sm'>
          Strava is connected. Your runs from the last 90 days are in.
        </p>
      )}

      {overview ? <ConnectedView overview={overview} /> : <ConnectCard />}
    </div>
  );
}

async function ConnectCard() {
  const configured = stravaConfigured();
  const spotsLeft = await stravaSpotsLeft();

  return (
    <Card size='sm' className='max-w-xl'>
      <CardHeader>
        <CardTitle>Run to skip the bill</CardTitle>
      </CardHeader>
      <CardContent className='space-y-3 text-sm'>
        <ul className='list-disc space-y-1 pl-5 text-muted-foreground'>
          <li>
            Each run you record as a Run on Strava gets a run score. Run
            further or faster to score higher.{" "}
            <RunScoreInfo label='How scoring works' />
          </li>
          <li>
            Slower than 11:30/km counts as a walk, and runs typed in by hand
            don&apos;t count.
          </li>
          <li>
            The leaderboard locks at the day&apos;s first spin. In each window,
            whoever ranks highest sits out.
          </li>
        </ul>

        {!configured ? (
          <p className='border border-border bg-muted px-4 py-3 font-medium'>
            Strava isn&apos;t set up yet. Ask your admin to try again later.
          </p>
        ) : spotsLeft === 0 ? (
          <p className='border border-border bg-muted px-4 py-3 font-medium'>
            More spots coming soon.
          </p>
        ) : (
          <ConnectStravaForm />
        )}
      </CardContent>
    </Card>
  );
}

const STATUS_LABEL: Record<RecentActivity["status"], string> = {
  scores: "Counts",
  "too-slow": "Too slow to score",
  manual: "Typed in",
  "not-a-run": "Not a run",
};

function ConnectedView({
  overview,
}: {
  overview: NonNullable<Awaited<ReturnType<typeof getStravaOverview>>>;
}) {
  const { athlete, today, chart, recent, totals } = overview;

  return (
    <div className='space-y-3'>
      {/* profile and Today each get a full row, so neither stretches the
          other when it grows */}
      <AthleteCard athlete={athlete} />

      <Card size='sm'>
        <CardHeader>
          <CardTitle>Today</CardTitle>
          <p className='text-sm text-muted-foreground'>
            {today.lockedAt
              ? `Locked at ${istTime(today.lockedAt)}. Runs after that count from tomorrow.`
              : "Live until today's first spin locks it."}
          </p>
        </CardHeader>
        <CardContent>
          {today.entry ? (
            <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
              <Stat
                label='Rank'
                value={`#${today.entry.rank} of ${today.rankedCount}`}
              />
              <Stat
                label='Run score'
                value={today.entry.score.toFixed(2)}
                info={<RunScoreInfo className='-my-1' />}
              />
              <Stat label='Distance' value={formatKm(today.entry.distance)} />
              <Stat
                label='Pace'
                value={formatPace(
                  today.entry.distance,
                  today.entry.movingTime,
                )}
              />
            </div>
          ) : (
            <p className='text-sm text-muted-foreground'>
              No scoring run today
              {today.lockedAt ? " before the lock" : " yet"}.
            </p>
          )}
          <Link
            href='/runs'
            className='mt-3 inline-block text-sm underline underline-offset-4 hover:text-muted-foreground'
          >
            See today&apos;s leaderboard
          </Link>
        </CardContent>
      </Card>

      <div className='grid grid-cols-3 gap-3'>
        <Card size='sm'>
          <CardContent>
            <Stat label='Runs, 30 days' value={String(totals.runs)} />
          </CardContent>
        </Card>
        <Card size='sm'>
          <CardContent>
            <Stat label='Run km' value={totals.runKm.toFixed(1)} />
          </CardContent>
        </Card>
        <Card size='sm'>
          <CardContent>
            <Stat label='Walk km' value={totals.walkKm.toFixed(1)} />
          </CardContent>
        </Card>
      </div>

      <div className='grid gap-3 lg:grid-cols-2'>
        <StravaDistanceChart data={chart} />
        <StravaScoreChart data={chart} />
      </div>

      <Card size='sm'>
        <CardHeader>
          <CardTitle>Recent activities</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className='text-sm text-muted-foreground'>
              Nothing on Strava in the last 30 days.
            </p>
          ) : (
            <ul className='divide-y'>
              {recent.map((activity) => (
                <li
                  key={activity.id}
                  className='flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2'
                >
                  <div className='min-w-0'>
                    <p className='truncate font-medium'>{activity.name}</p>
                    <p className='text-xs text-muted-foreground'>
                      {activity.sportType} · {istDate(activity.startDate)}
                    </p>
                  </div>
                  <div className='flex items-center gap-3 text-sm tabular-nums'>
                    <span>{formatKm(activity.distance)}</span>
                    <span className='text-muted-foreground'>
                      {formatPace(activity.distance, activity.movingTime)}
                    </span>
                    <Badge
                      variant={
                        activity.status === "scores" ? "default" : "outline"
                      }
                    >
                      {STATUS_LABEL[activity.status]}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AthleteCard({ athlete }: { athlete: StravaOverview["athlete"] }) {
  const name = [athlete.firstName, athlete.lastName].filter(Boolean).join(" ");

  return (
    <Card size='sm'>
      <CardContent className='flex items-center gap-3'>
        <Avatar size='lg' className='size-12'>
          {athlete.photoUrl && <AvatarImage src={athlete.photoUrl} alt='' />}
          <AvatarFallback>
            {name.slice(0, 2).toUpperCase() || "S"}
          </AvatarFallback>
        </Avatar>
        <div className='min-w-0 flex-1'>
          <p className='truncate font-medium'>{name || "Strava athlete"}</p>
          <p className='text-xs text-muted-foreground'>
            Connected {istDate(athlete.connectedAt)}
          </p>
        </div>
        <DisconnectStravaButton />
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  info,
}: {
  label: string;
  value: string;
  info?: ReactNode;
}) {
  return (
    <div>
      <p className='flex items-center gap-1 text-xs text-muted-foreground'>
        {label}
        {info}
      </p>
      <p className='text-lg font-semibold tabular-nums'>{value}</p>
    </div>
  );
}
