"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SnackyMark } from "@/components/snacky-mark";
import { awards as officeAwards, roasts as officeRoasts, SAMPLE_PERIOD } from "./sample-data";

// SnackySummaryCard's frame with scripted jokes. The real card asks Gemini,
// which a public page must never do.
export function DemoRoastCard({
  roasts = officeRoasts,
  awards = officeAwards,
  footer = "312 orders · ₹24,600.00 · most ordered: Samosa",
}: {
  roasts?: typeof officeRoasts;
  awards?: typeof officeAwards;
  footer?: string;
}) {
  const [slide, setSlide] = useState(0);
  const SLIDES = roasts.length + 1;
  const onAwards = slide === roasts.length;
  const roast = roasts[slide];
  const step = (by: number) => setSlide((current) => (current + by + SLIDES) % SLIDES);

  return (
    <section className='border bg-card'>
      <header className='flex items-center gap-2 border-b py-1 pr-1 pl-4'>
        <SnackyMark className='size-5' />
        <h2 className='min-w-0 flex-1 truncate text-xs font-semibold text-muted-foreground'>
          {onAwards ? "The Snacky awards" : "Snacky’s roast"} · {SAMPLE_PERIOD}
        </h2>
        <span className='mr-1 text-xs text-muted-foreground tabular-nums'>
          {slide + 1}/{SLIDES}
        </span>
        <Button type='button' size='icon-sm' variant='ghost' className='size-8' onClick={() => step(-1)} aria-label='Previous'>
          <ChevronLeft />
        </Button>
        <Button type='button' size='icon-sm' variant='ghost' className='size-8' onClick={() => step(1)} aria-label='Next'>
          <ChevronRight />
        </Button>
        <Button type='button' size='icon-sm' variant='ghost' className='size-8' onClick={() => step(1)} aria-label='Roast again' title='Roast again'>
          <RotateCcw />
        </Button>
      </header>

      <div key={slide} aria-live='polite' className='animate-in duration-300 fade-in'>
        {onAwards ? (
          <ul className='grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0'>
            {awards.map((award) => (
              <li key={award.title} className='min-w-0 space-y-0.5 px-4 py-3.5'>
                <p className='truncate text-xs font-semibold text-primary'>{award.title}</p>
                <p className='truncate text-base font-semibold'>{award.winner}</p>
                <p className='text-xs text-muted-foreground'>{award.quip}</p>
              </li>
            ))}
          </ul>
        ) : (
          <div className='space-y-1.5 px-4 py-3.5'>
            <p className='font-heading text-xl leading-snug sm:text-2xl'>
              <span className='text-primary'>{roast.lead}</span>
              {roast.line}{" "}
              <span className='text-muted-foreground italic'>{roast.aside}</span>
            </p>
            <p className='text-xs text-muted-foreground'>{footer}</p>
          </div>
        )}
      </div>
    </section>
  );
}
