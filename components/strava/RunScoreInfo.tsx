"use client";

import { useState } from "react";
import { Info } from "lucide-react";

import {
  formatPace,
  runScore,
  WALK_PACE_SECONDS_PER_KM,
} from "@/modules/strava/run-score";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

// How the run score works, in plain words and with a "try it" calculator
// instead of sums (modules/strava/run-score.ts has the formula). A popover,
// not a tooltip, so it opens on tap too.

// the pace slider runs from 11:30/km (slowest that scores) to 4:00/km in
// 15-second steps, so dragging right means faster
const FASTEST_PACE = 240;
const PACE_STEP = 15;
const PACE_STEPS = (WALK_PACE_SECONDS_PER_KM - FASTEST_PACE) / PACE_STEP;

type Props = {
  // text after the icon, e.g. "How scoring works"; icon only when left out
  label?: string;
  className?: string;
};

export function RunScoreInfo({ label, className }: Props) {
  return (
    <Popover>
      <PopoverTrigger
        aria-label={label ? undefined : "How the run score works"}
        className={cn(
          "inline-flex shrink-0 cursor-pointer items-center gap-1 align-middle text-muted-foreground transition-colors hover:text-foreground",
          label
            ? "text-sm underline underline-offset-4"
            : "size-5 justify-center",
          className,
        )}
      >
        <Info className='size-3.5' />
        {label}
      </PopoverTrigger>
      <PopoverContent
        align='start'
        collisionPadding={16}
        className='max-h-(--radix-popover-content-available-height) w-[22rem] max-w-[calc(100vw-2rem)] gap-4 overflow-y-auto normal-case tracking-normal'
      >
        <p className='text-xs font-semibold uppercase tracking-wider'>
          How the run score works
        </p>

        <ul className='space-y-2'>
          <li className='flex gap-2'>
            <span aria-hidden className='font-semibold'>↑</span>
            <span>
              <span className='font-semibold'>Run further</span> and your score
              goes up.
            </span>
          </li>
          <li className='flex gap-2'>
            <span aria-hidden className='font-semibold'>↑</span>
            <span>
              <span className='font-semibold'>Run faster</span> and your score
              goes up.
            </span>
          </li>
          <li className='text-muted-foreground'>
            Speed counts a little more than distance, so a long, slow jog
            won&apos;t beat a good, quick run. You don&apos;t need to work
            anything out: SnackDesk scores your Strava runs for you.
          </li>
        </ul>

        <ScoreCalculator />

        <ul className='list-disc space-y-1 border-t pt-3 pl-4 text-xs text-muted-foreground'>
          <li>
            Only Runs recorded on Strava count, at 11:30/km or faster. Runs
            typed in by hand don&apos;t.
          </li>
          <li>Ran twice in a day? Both runs are added together.</li>
          <li>The day&apos;s scores lock at its first spin.</li>
          <li>
            The formula, if you want it: speed in km/h × km to the power 0.4.
          </li>
        </ul>
      </PopoverContent>
    </Popover>
  );
}

function formatDuration(seconds: number) {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

function ScoreCalculator() {
  const [km, setKm] = useState(5);
  // steps faster than 11:30/km; 18 steps is 7:00/km
  const [faster, setFaster] = useState(18);

  const pace = WALK_PACE_SECONDS_PER_KM - faster * PACE_STEP;
  const distance = km * 1000;
  const movingTime = pace * km;

  return (
    <div className='space-y-4 border bg-muted/50 p-3'>
      <p className='text-xs font-semibold uppercase tracking-wider'>
        Try it
      </p>

      <div className='space-y-2'>
        <div className='flex items-baseline justify-between'>
          <span className='text-muted-foreground'>Distance</span>
          <span className='font-semibold tabular-nums'>{km} km</span>
        </div>
        <Slider
          aria-label='Distance'
          min={1}
          max={21}
          step={0.5}
          value={[km]}
          onValueChange={([value]) => setKm(value)}
        />
      </div>

      <div className='space-y-2'>
        <div className='flex items-baseline justify-between'>
          <span className='text-muted-foreground'>Pace</span>
          <span className='font-semibold tabular-nums'>
            {formatPace(1000, pace)}
          </span>
        </div>
        <Slider
          aria-label='Pace'
          aria-valuetext={formatPace(1000, pace)}
          min={0}
          max={PACE_STEPS}
          step={1}
          value={[faster]}
          onValueChange={([value]) => setFaster(value)}
        />
        <div className='flex justify-between text-xs text-muted-foreground'>
          <span>slower</span>
          <span>faster</span>
        </div>
      </div>

      <div className='flex items-end justify-between border-t pt-3'>
        <span className='text-muted-foreground'>
          {km} km in {formatDuration(movingTime)}
        </span>
        <span className='text-right'>
          <span className='block text-xs text-muted-foreground'>Run score</span>
          <span className='text-2xl font-semibold tabular-nums'>
            {runScore(distance, movingTime).toFixed(2)}
          </span>
        </span>
      </div>
    </div>
  );
}
