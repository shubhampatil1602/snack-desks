"use client";

import { Info } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// How the run score works, in plain words (modules/strava/run-score.ts has the
// formula; RunScoreCalculator works out a score). A popover, not a tooltip, so
// it opens on tap too.

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
