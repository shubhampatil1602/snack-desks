"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import { format } from "date-fns";
import type { DayButton } from "react-day-picker";

import type { ActivityKind, LogDay } from "@/modules/strava/queries";
import { formatKm, formatPace } from "@/modules/strava/run-score";

import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ACTIVITY_STATUS, formatDuration, formatMinute } from "./activity-status";

// The Strava page's training log: a month calendar of run and walk km
// (react-day-picker through components/ui/calendar) and the picked day's
// details. Every activity counts for its day here; the frozen leaderboard
// only has the runs from before the first spin.

type Props = {
  firstDay: string; // YYYY-MM-DD, the first month that can be shown
  today: string; // YYYY-MM-DD in IST
  days: LogDay[]; // only days with activities or a spin
};

/** "2026-11-21" → that date at local midnight, which the calendar works in */
function toDate(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

const LogContext = createContext<{ byDay: Map<string, LogDay>; today: string }>({
  byDay: new Map(),
  today: "",
});

const KIND_BAR: Record<ActivityKind, string> = {
  run: "bg-chart-1",
  walk: "bg-chart-2",
  other: "bg-muted-foreground/60",
};

// the day timeline runs from 5 am to 11 pm
const TIMELINE_START = 5 * 60;
const TIMELINE_SPAN = 18 * 60;
const TICK_HOURS = [6, 9, 12, 15, 18, 21];

function timelinePercent(minute: number) {
  return Math.min(100, Math.max(0, ((minute - TIMELINE_START) / TIMELINE_SPAN) * 100));
}

export function StravaTrainingLog({ firstDay, today, days }: Props) {
  const byDay = useMemo(() => new Map(days.map((day) => [day.day, day])), [days]);
  // the day in the dialog; kept after closing so the dialog can fade out
  const [picked, setPicked] = useState(today);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => toDate(today));

  // totals for the month on show
  const monthKey = format(month, "yyyy-MM");
  const monthDays = days.filter((day) => day.day.startsWith(monthKey));
  const monthActivities = monthDays.flatMap((day) => day.activities);
  const count = (kind: ActivityKind) =>
    monthActivities.filter((activity) => activity.kind === kind).length;
  const km = (key: "runKm" | "walkKm") =>
    monthDays.reduce((total, day) => total + day[key], 0).toFixed(1);

  return (
    <LogContext.Provider value={{ byDay, today }}>
      <div className='space-y-2'>
        <Calendar
          onDayClick={(date, modifiers) => {
            if (modifiers.disabled || modifiers.hidden) return;
            setPicked(toKey(date));
            setOpen(true);
          }}
          month={month}
          onMonthChange={setMonth}
          weekStartsOn={1}
          showOutsideDays={false}
          startMonth={toDate(firstDay)}
          endMonth={toDate(today)}
          disabled={[{ before: toDate(firstDay) }, { after: toDate(today) }]}
          formatters={{ formatWeekdayName: (date) => format(date, "EEE") }}
          labels={{
            labelDayButton: (date) => dayLabel(date, byDay.get(toKey(date))),
          }}
          components={{ DayButton: LogDayButton }}
          className='w-full bg-transparent p-0 [--cell-size:--spacing(9)]'
          classNames={{
            root: "w-full",
            months: "relative flex flex-col",
            month: "flex w-full flex-col gap-3",
            month_grid: "w-full border",
            weekdays: "flex border-b",
            weekday:
              "min-w-0 flex-1 px-2 py-1.5 text-left text-[11px] font-semibold tracking-widest text-muted-foreground uppercase select-none",
            week: "flex w-full border-b last:border-b-0",
            day: "relative min-w-0 flex-1 border-r p-0 last:border-r-0",
            today: "",
            outside: "",
            disabled: "opacity-40",
            hidden: "bg-muted/40",
          }}
        />
        <p className='text-xs text-muted-foreground tabular-nums'>
          {format(month, "MMMM")}: {count("run")} runs, {km("runKm")} km ·{" "}
          {count("walk")} walks, {km("walkKm")} km
        </p>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='sm:max-w-lg'>
          <DayDetail
            dayKey={picked}
            day={byDay.get(picked)}
            isToday={picked === today}
          />
        </DialogContent>
      </Dialog>
    </LogContext.Provider>
  );
}

function dayLabel(date: Date, day: LogDay | undefined) {
  const parts = [format(date, "EEEE, d MMMM")];
  if (day && day.runKm > 0) parts.push(`${day.runKm.toFixed(2)} km run`);
  if (day && day.walkKm > 0) parts.push(`${day.walkKm.toFixed(1)} km walk`);
  return parts.join(", ");
}

function LogDayButton({
  className,
  day,
  modifiers,
  ...props
}: ComponentProps<typeof DayButton>) {
  const { byDay, today } = useContext(LogContext);
  const key = toKey(day.date);
  const data = byDay.get(key);

  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <button
      ref={ref}
      {...props}
      className={cn(
        "flex h-16 w-full cursor-pointer flex-col items-start gap-0.5 px-2 py-1.5 text-left tabular-nums outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset disabled:pointer-events-none sm:h-20",
        className,
      )}
    >
      <span
        className={cn(
          "text-xs text-muted-foreground",
          key === today && "font-bold text-primary",
        )}
      >
        {day.date.getDate()}
      </span>
      {/* a day's runs (and walks) add up into one number; the unit is left
          out on phones, where the cells are too narrow for it */}
      {data && data.runKm > 0 && (
        <span className='text-xs font-semibold whitespace-nowrap text-chart-1 sm:text-sm'>
          {data.runKm.toFixed(2)}
          <span className='hidden text-xs font-normal sm:inline'> km</span>
        </span>
      )}
      {data && data.walkKm > 0 && (
        <span className='text-xs font-semibold whitespace-nowrap text-chart-2 sm:text-sm'>
          {data.walkKm.toFixed(2)}
          <span className='hidden text-xs font-normal sm:inline'> km</span>
        </span>
      )}
    </button>
  );
}

/** The picked day, inside the dialog. */
function DayDetail({
  dayKey,
  day,
  isToday,
}: {
  dayKey: string;
  day: LogDay | undefined;
  isToday: boolean;
}) {
  const spin =
    day?.lockMinute != null
      ? `First spin at ${formatMinute(day.lockMinute)}`
      : isToday
        ? "Live until the first spin"
        : "No spin that day";

  return (
    <>
      <DialogHeader>
        <DialogTitle>{format(toDate(dayKey), "EEEE, d MMM yyyy")}</DialogTitle>
        <DialogDescription>{spin}</DialogDescription>
      </DialogHeader>

      <div className='space-y-4 text-sm tabular-nums'>
        {!day || day.activities.length === 0 ? (
          <p className='text-muted-foreground'>Nothing on Strava this day.</p>
        ) : (
          <>
            <DayStats day={day} isToday={isToday} />
            <DayTimeline day={day} />
            <ul className='divide-y'>
              {day.activities.map((activity) => {
                const status = ACTIVITY_STATUS[activity.status];
                return (
                  <li
                    key={activity.id}
                    className='grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 py-2'
                  >
                    <span className='flex min-w-0 items-baseline gap-2'>
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
                    <span className='text-right font-semibold'>
                      {formatKm(activity.distance)}
                    </span>
                    <span className='col-span-2 text-xs text-muted-foreground'>
                      {formatMinute(activity.startMinute)} ·{" "}
                      {formatPace(activity.distance, activity.movingTime)} ·{" "}
                      {formatDuration(activity.movingTime)} moving
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </>
  );
}

function DayStats({ day, isToday }: { day: LogDay; isToday: boolean }) {
  const onBoardDiffers =
    day.board != null &&
    day.board.locked &&
    Math.abs(day.board.score - (day.score ?? 0)) >= 0.005;

  const stats = [
    {
      label: "Run score",
      value: day.score != null ? day.score.toFixed(2) : "–",
      note: onBoardDiffers
        ? `${day.board!.score.toFixed(2)} on the board`
        : day.scoringRuns > 0
          ? `from ${day.scoringRuns} run${day.scoringRuns === 1 ? "" : "s"}`
          : "no scoring run",
    },
    {
      label: "Rank that day",
      value: day.board ? `#${day.board.rank}` : "–",
      note: day.board
        ? day.board.locked
          ? `of ${day.board.of} at the spin`
          : `of ${day.board.of}${isToday ? " so far" : ", no spin that day"}`
        : day.lockedAt
          ? "not on the board"
          : "no scoring run",
    },
    {
      label: "Run",
      value: day.runKm > 0 ? `${day.runKm.toFixed(2)} km` : "–",
      note: day.runKm > 0 ? `at ${formatPace(day.runKm * 1000, day.runTime)}` : "no run",
    },
    {
      label: "Walk",
      value: day.walkKm > 0 ? `${day.walkKm.toFixed(2)} km` : "–",
      note:
        day.walkKm > 0 ? `at ${formatPace(day.walkKm * 1000, day.walkTime)}` : "no walk",
    },
  ];

  return (
    <div className='grid grid-cols-2 gap-px border bg-border'>
      {stats.map((stat) => (
        <div key={stat.label} className='bg-card px-3 py-2.5'>
          <p className='text-xs text-muted-foreground'>{stat.label}</p>
          <p className='text-lg font-semibold'>{stat.value}</p>
          <p className='text-xs text-muted-foreground'>{stat.note}</p>
        </div>
      ))}
    </div>
  );
}

function DayTimeline({ day }: { day: LogDay }) {
  const lockLeft = day.lockMinute != null ? timelinePercent(day.lockMinute) : null;
  const label = [
    "When you were active that day:",
    ...day.activities.map(
      (activity) => `${activity.name} at ${formatMinute(activity.startMinute)}`,
    ),
    day.lockMinute != null ? `First spin at ${formatMinute(day.lockMinute)}.` : "",
  ].join(" ");

  return (
    <div>
      <p className='text-[11px] font-semibold tracking-widest text-muted-foreground uppercase'>
        Your day
      </p>
      <div role='img' aria-label={label} className='relative mt-6 h-14 border bg-card'>
        {lockLeft != null && (
          <>
            <span
              aria-hidden
              className='absolute -top-5 -translate-x-1/2 text-[10px] font-semibold tracking-wider whitespace-nowrap text-primary uppercase'
              style={{ left: `${lockLeft}%` }}
            >
              First spin {formatMinute(day.lockMinute!)}
            </span>
            <span
              aria-hidden
              className='absolute inset-y-0 -ml-px w-0.5 bg-primary'
              style={{ left: `${lockLeft}%` }}
            />
          </>
        )}
        {day.activities.map((activity) => {
          const width = Math.max((activity.elapsedTime / 60 / TIMELINE_SPAN) * 100, 1.5);
          const left = Math.min(timelinePercent(activity.startMinute), 100 - width);
          return (
            <span
              key={activity.id}
              aria-hidden
              className={cn("absolute inset-y-3", KIND_BAR[activity.kind])}
              style={{ left: `${left}%`, width: `${width}%` }}
            />
          );
        })}
      </div>
      <div aria-hidden className='relative h-5 text-[11px] text-muted-foreground'>
        {TICK_HOURS.map((hour) => (
          <span
            key={hour}
            className='absolute top-1 -translate-x-1/2'
            style={{ left: `${timelinePercent(hour * 60)}%` }}
          >
            {hour % 12 || 12} {hour < 12 ? "am" : "pm"}
          </span>
        ))}
      </div>
    </div>
  );
}
