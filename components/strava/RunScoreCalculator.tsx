"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";
import { z } from "zod";

import {
  formatPace,
  runScore,
  WALK_PACE_SECONDS_PER_KM,
} from "@/modules/strava/run-score";

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

// Type a distance and a pace to see the run score (modules/strava/run-score.ts).
// On the runs leaderboard and the Strava page.

/** A field's text as a number in a range, with a message for each way it can be wrong. */
function decimalField(
  name: string,
  { min, max, minMessage }: { min: number; max: number; minMessage: string },
) {
  return z
    .string()
    .trim()
    .min(1, `Type the ${name}`)
    .pipe(
      z.coerce
        .number<string>({ error: `Type the ${name} as a number` })
        .min(min, minMessage)
        .max(max, `Keep the ${name} to ${max} or less`),
    );
}

const calculatorSchema = z.object({
  km: decimalField("distance", {
    min: 0.01,
    max: 100,
    minMessage: "Type a distance above 0",
  }),
  // minutes per km as a decimal: 6.5 is 6:30/km
  pace: decimalField("pace", {
    min: 2,
    max: 30,
    minMessage: "Faster than 2 min/km isn't a run",
  }),
});

type Fields = z.input<typeof calculatorSchema>;

export function RunScoreCalculator() {
  const [fields, setFields] = useState<Fields>({ km: "5", pace: "6.5" });
  const parsed = calculatorSchema.safeParse(fields);
  const errors = parsed.success ? {} : z.flattenError(parsed.error).fieldErrors;

  const set = (name: keyof Fields) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setFields((current) => ({ ...current, [name]: event.target.value }));

  // the pace as m:ss, once it is valid on its own
  const paceOk = !errors.pace && fields.pace.trim() !== "";
  const paceClock = paceOk ? formatPace(1000, Number(fields.pace) * 60) : null;

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
            <Label htmlFor='calc-km'>Distance (km)</Label>
            <Input
              id='calc-km'
              type='number'
              inputMode='decimal'
              min={0}
              max={100}
              step={0.01}
              value={fields.km}
              onChange={set("km")}
              aria-invalid={!!errors.km}
              aria-describedby='calc-km-hint'
            />
            <FieldHint id='calc-km-hint' error={errors.km?.[0]} />
          </div>
          <div className='space-y-1'>
            <Label htmlFor='calc-pace'>Pace (min/km)</Label>
            <Input
              id='calc-pace'
              type='number'
              inputMode='decimal'
              min={2}
              max={30}
              step={0.01}
              placeholder='6.5'
              value={fields.pace}
              onChange={set("pace")}
              aria-invalid={!!errors.pace}
              aria-describedby='calc-pace-hint'
            />
            <FieldHint
              id='calc-pace-hint'
              error={errors.pace?.[0]}
              hint={paceClock ? `That's ${paceClock}` : undefined}
            />
          </div>
        </div>

        <Result values={parsed.success ? parsed.data : null} />
      </DialogContent>
    </Dialog>
  );
}

function FieldHint({ id, error, hint }: { id: string; error?: string; hint?: string }) {
  return (
    <p
      id={id}
      className={error ? "text-xs text-destructive" : "text-xs text-muted-foreground"}
    >
      {error ?? hint ?? " "}
    </p>
  );
}

function Result({ values }: { values: { km: number; pace: number } | null }) {
  if (!values) {
    return (
      <p aria-live='polite' className='border-t pt-4 text-muted-foreground'>
        Fix the fields above to see the score.
      </p>
    );
  }

  const paceSeconds = values.pace * 60;
  if (paceSeconds > WALK_PACE_SECONDS_PER_KM) {
    return (
      <p aria-live='polite' className='border-t pt-4 text-muted-foreground'>
        Slower than 11:30/km counts as a walk, so it scores 0.
      </p>
    );
  }

  const distance = values.km * 1000;
  const movingTime = Math.round(paceSeconds * values.km);

  return (
    <div aria-live='polite' className='space-y-1 border-t pt-4'>
      <p className='text-xs text-muted-foreground'>Run score</p>
      <p className='text-2xl font-semibold tabular-nums'>
        {runScore(distance, movingTime).toFixed(2)}
      </p>
      <p className='text-xs text-muted-foreground tabular-nums'>
        {values.km} km in {formatDuration(movingTime)} ·{" "}
        {(3600 / paceSeconds).toFixed(2)} km/h
      </p>
    </div>
  );
}
