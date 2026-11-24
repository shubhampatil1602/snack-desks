"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";

import { runScore, WALK_PACE_SECONDS_PER_KM } from "@/modules/strava/run-score";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDuration } from "./activity-status";

// Type a distance and a pace to see the run score and the sum behind it
// (modules/strava/run-score.ts). On the runs leaderboard and the Strava page.

/** "6:30" or "6" (minutes per km) as seconds, or null if it isn't a pace. */
function parsePace(text: string): number | null {
  const clock = text.trim().match(/^(\d{1,2})(?::([0-5]\d))?$/);
  if (!clock) return null;
  const seconds = Number(clock[1]) * 60 + Number(clock[2] ?? 0);
  return seconds > 0 ? seconds : null;
}

/** 5 → "5", 5.25 → "5.25" */
function trimNumber(value: number) {
  return String(Math.round(value * 100) / 100);
}

export function RunScoreCalculator() {
  const [distanceText, setDistanceText] = useState("5");
  const [paceText, setPaceText] = useState("6:30");

  const km = Number(distanceText);
  const distanceOk = distanceText.trim() !== "" && km > 0 && km <= 100;
  const pace = parsePace(paceText);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant='outline' size='sm'>
          <Calculator />
          Score calculator
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Run score calculator</DialogTitle>
          <DialogDescription>
            Type a distance and a pace to see what the run would score.
          </DialogDescription>
        </DialogHeader>

        <div className='grid grid-cols-2 gap-4'>
          <div className='space-y-1'>
            <Label htmlFor='calc-distance'>Distance (km)</Label>
            <Input
              id='calc-distance'
              type='number'
              inputMode='decimal'
              min={0}
              max={100}
              step={0.01}
              value={distanceText}
              onChange={(event) => setDistanceText(event.target.value)}
              aria-invalid={!distanceOk}
            />
          </div>
          <div className='space-y-1'>
            <Label htmlFor='calc-pace'>Pace (min/km)</Label>
            <Input
              id='calc-pace'
              inputMode='numeric'
              placeholder='6:30'
              value={paceText}
              onChange={(event) => setPaceText(event.target.value)}
              aria-invalid={pace === null}
            />
          </div>
        </div>

        <Result km={distanceOk ? km : null} pace={pace} />
      </DialogContent>
    </Dialog>
  );
}

function Result({ km, pace }: { km: number | null; pace: number | null }) {
  let message: string | null = null;
  if (km === null) message = "Type a distance between 0 and 100 km.";
  else if (pace === null) message = "Type the pace like 6:30.";
  else if (pace > WALK_PACE_SECONDS_PER_KM)
    message = "Slower than 11:30/km counts as a walk, so it scores 0.";

  if (message || km === null || pace === null) {
    return (
      <p aria-live='polite' className='border-t pt-4 text-muted-foreground'>
        {message}
      </p>
    );
  }

  const speed = 3600 / pace;
  const score = runScore(km * 1000, pace * km);

  return (
    <div aria-live='polite' className='space-y-1 border-t pt-4'>
      <p className='text-xs text-muted-foreground'>Run score</p>
      <p className='text-2xl font-semibold tabular-nums'>{score.toFixed(2)}</p>
      <p className='text-xs text-muted-foreground tabular-nums'>
        {trimNumber(km)} km in {formatDuration(Math.round(pace * km))} ·{" "}
        {speed.toFixed(2)} km/h
      </p>
    </div>
  );
}
