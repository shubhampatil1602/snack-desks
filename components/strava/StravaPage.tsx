import Link from "next/link";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

import { stravaConfigured } from "@/lib/strava/api";
import {
  getStravaOverview,
  getStravaReach,
  type StravaOverview,
} from "@/modules/strava/queries";
import { formatKm, formatPace } from "@/modules/strava/run-score";

import { StatGroup, type Stat } from "@/components/dashboard/StatGroup";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ACTIVITY_STATUS, formatMinute } from "./activity-status";
import { ConnectStravaForm } from "./ConnectStravaForm";
import { DisconnectStravaButton } from "./DisconnectStravaButton";
import { RunScoreCalculator } from "./RunScoreCalculator";
import { RunScoreInfo } from "./RunScoreInfo";
import { StravaTrainingLog } from "./StravaTrainingLog";

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

/** "2026-11-21" → "21 Nov 2026" (format reads the date parts, so any server timezone works) */
function dayLabel(key: string, pattern: string) {
  const [year, month, day] = key.split("-").map(Number);
  return format(new Date(year, month - 1, day), pattern);
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
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='mb-3'>
          <h1 className='text-2xl font-heading tracking-wide'>
            {overview ? "Your Strava activity" : "Connect with Strava"}
          </h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            The day&apos;s best runner in a window sits out its spin, so they
            won&apos;t be split master.
          </p>
        </div>
        <RunScoreCalculator />
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

      {overview ? (
        <ConnectedView overview={overview} />
      ) : (
        <ConnectCard organizationId={organizationId} />
      )}
    </div>
  );
}

async function ConnectCard({ organizationId }: { organizationId: string }) {
  const configured = stravaConfigured();
  const { connected, members, spotsLeft } = await getStravaReach(organizationId);

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
            Slower than 12:00/km still shows on the leaderboard but scores
            0. Runs typed in by hand don&apos;t count.
          </li>
          <li>
            The leaderboard locks at the day&apos;s first spin. In each window,
            whoever ranks highest sits out.
          </li>
        </ul>

        {configured && (
          <p className='text-xs text-muted-foreground tabular-nums'>
            <span className='font-semibold text-foreground'>{connected}</span> of{" "}
            {members} people here are on Strava
          </p>
        )}

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

function ConnectedView({ overview }: { overview: StravaOverview }) {
  const { athlete, today, log, recent } = overview;
  const name =
    [athlete.firstName, athlete.lastName].filter(Boolean).join(" ") ||
    "your Strava athlete";

  return (
    <div className='space-y-3'>
      <Card size='sm'>
        <CardContent className='flex flex-wrap items-center gap-3'>
          <Avatar size='lg' className='size-12'>
            {athlete.photoUrl && <AvatarImage src={athlete.photoUrl} alt='' />}
            <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className='min-w-0 flex-1'>
            <p className='truncate font-medium'>{name}</p>
            <p className='text-xs text-muted-foreground'>
              Connected to Strava on{" "}
              {format(toZonedTime(athlete.connectedAt, "Asia/Kolkata"), "d MMM yyyy")}
            </p>
          </div>
          <DisconnectStravaButton />
        </CardContent>
      </Card>

      <TodayCard today={today} />

      <Card size='sm'>
        <CardHeader>
          <CardTitle>Training log</CardTitle>
          <CardDescription>
            Since {dayLabel(log.firstDay, "d MMM yyyy")}. Tap a day to see
            it.
          </CardDescription>
          <CardAction>
            <div aria-hidden className='flex gap-3 pt-1.5 text-xs text-muted-foreground'>
              <span className='inline-flex items-center gap-1.5'>
                <span className='size-2 bg-chart-1' />
                Run km
              </span>
              <span className='inline-flex items-center gap-1.5'>
                <span className='size-2 bg-chart-2' />
                Walk km
              </span>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          <StravaTrainingLog firstDay={log.firstDay} today={log.today} days={log.days} />
        </CardContent>
      </Card>

      <Card size='sm'>
        <CardHeader>
          <CardTitle>Activities</CardTitle>
          <CardAction>
            <span className='text-xs text-muted-foreground'>Latest on Strava</span>
          </CardAction>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className='text-sm text-muted-foreground'>Nothing on Strava yet.</p>
          ) : (
            <ol className='divide-y'>
              {recent.map((activity) => {
                const status = ACTIVITY_STATUS[activity.status];
                return (
                  <li
                    key={activity.id}
                    className='grid grid-cols-[5.5rem_minmax(0,1fr)_auto] items-baseline gap-x-4 py-3 tabular-nums first:pt-0 last:pb-0 sm:grid-cols-[7rem_minmax(0,1fr)_auto]'
                  >
                    <span className='text-xs font-semibold text-muted-foreground'>
                      {activity.day === log.today
                        ? "Today"
                        : dayLabel(activity.day, "EEE d MMM")}
                    </span>
                    <span className='min-w-0'>
                      <span className='flex items-baseline gap-2'>
                        <span className='truncate font-medium'>{activity.name}</span>
                        <span
                          className={cn(
                            "shrink-0 text-[10px] font-semibold tracking-widest uppercase",
                            status.className,
                          )}
                        >
                          {status.label}
                        </span>
                      </span>
                      <span className='mt-0.5 block text-xs text-muted-foreground'>
                        {activity.sportType} · {formatMinute(activity.startMinute)} ·{" "}
                        {formatPace(activity.distance, activity.movingTime)}
                      </span>
                    </span>
                    <span className='text-right font-semibold'>
                      {formatKm(activity.distance)}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// the same strip as the dashboard and the leaderboard
function TodayCard({ today }: { today: StravaOverview["today"] }) {
  const { entry, rankedCount, lockedAt } = today;
  const status = lockedAt
    ? `locked at ${istTime(lockedAt)}`
    : "live until the first spin";
  const runners = `${rankedCount} runner${rankedCount === 1 ? "" : "s"}`;

  const stats: Stat[] = entry?.rank
    ? [
        { label: "Rank", value: `#${entry.rank}`, note: `of ${runners}` },
        {
          label: "Run score",
          value: entry.score.toFixed(2),
          note: lockedAt ? "at the spin" : "so far today",
        },
        {
          label: "Distance",
          value: formatKm(entry.distance),
          note: `at ${formatPace(entry.distance, entry.movingTime)}`,
        },
      ]
    : [
        {
          label: "Rank",
          value: "–",
          note: entry
            ? "too slow to score"
            : lockedAt
              ? "no run before the spin"
              : "no scoring run yet",
          dim: true,
        },
        {
          label: "Run score",
          value: "–",
          note: entry ? `slower than 12:00/km` : "no scoring run",
          dim: true,
        },
        {
          label: "On the board",
          value: String(rankedCount),
          note: rankedCount === 1 ? "runner today" : "runners today",
          dim: rankedCount === 0,
        },
      ];

  return (
    <StatGroup
      title={`Today · ${status}`}
      stats={stats}
      action={
        <Link
          href='/runs'
          className='text-xs font-semibold text-muted-foreground underline underline-offset-4 hover:text-foreground'
        >
          See the leaderboard
        </Link>
      }
    />
  );
}
