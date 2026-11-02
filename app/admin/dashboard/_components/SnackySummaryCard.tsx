"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";

import { refreshMySnackySummaryAction, refreshSnackySummaryAction } from "@/actions/snacky";
import type { SnackySummary } from "@/modules/snacky/summary";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SnackyMark } from "@/components/snacky-mark";
import { cn } from "@/lib/utils";

// Snacky's cheeky take on the picked period: roasts to flip through, then
// its made-up awards as the last slide. It stays as written until the admin
// asks for a fresh one.
export function SnackySummaryCard({
  period,
  periodLabel,
  initial,
  initialError,
  mine = false,
}: {
  period: string;
  periodLabel: string;
  initial: SnackySummary | null;
  initialError?: string;
  // the signed-in person's own roast, on their dashboard
  mine?: boolean;
}) {
  const [summary, setSummary] = useState(initial);
  const [error, setError] = useState(initialError ?? null);
  const [loading, setLoading] = useState(false);
  const [slide, setSlide] = useState(0);

  const roasts = summary?.roasts ?? [];
  const hasAwards = (summary?.awards.length ?? 0) > 0;
  const count = roasts.length + (hasAwards ? 1 : 0);
  const onAwards = hasAwards && slide === roasts.length;
  const roast = roasts[slide];

  async function refresh() {
    setLoading(true);
    setError(null);
    const result = mine
      ? await refreshMySnackySummaryAction(period)
      : await refreshSnackySummaryAction(period);
    setLoading(false);
    if (result.success) {
      setSummary(result.data);
      setSlide(0);
    } else {
      setError(result.error);
    }
  }

  const step = (by: number) => setSlide((current) => (current + by + count) % count);

  return (
    // same frame as the stat groups above: a titled strip, then the body
    <section className='border bg-card'>
      <header className='flex items-center gap-2 border-b py-1 pr-1 pl-4'>
        <SnackyMark className='size-5' />
        <h2 className='min-w-0 flex-1 truncate text-xs font-semibold text-muted-foreground'>
          {onAwards
            ? mine
              ? "Your Snacky awards"
              : "The Snacky awards"
            : mine
              ? "Snacky roasts you"
              : "Snacky's roast"}{" "}
          · {periodLabel}
          {summary && (
            <span suppressHydrationWarning className='hidden font-normal sm:inline'>
              {" "}· updated {formatDistanceToNow(summary.updatedAt, { addSuffix: true })}
            </span>
          )}
        </h2>
        {count > 1 && (
          <>
            <span className='mr-1 text-xs text-muted-foreground tabular-nums'>
              {slide + 1}/{count}
            </span>
            <Button size='icon-sm' variant='ghost' className='size-8' onClick={() => step(-1)} aria-label='Previous'>
              <ChevronLeft />
            </Button>
            <Button size='icon-sm' variant='ghost' className='size-8' onClick={() => step(1)} aria-label='Next'>
              <ChevronRight />
            </Button>
          </>
        )}
        <Button
          size='icon-sm'
          variant='ghost'
          className='size-8'
          onClick={refresh}
          disabled={loading}
          aria-label='Roast again'
          title='Roast again'
        >
          <RotateCcw className={cn(loading && "animate-spin direction-[reverse]")} />
        </Button>
      </header>

      {error && <p className='px-4 pt-3 text-sm text-destructive'>{error}</p>}

      {!summary ? (
        loading ? (
          <div className='space-y-2 px-4 py-3.5'>
            <Skeleton className='h-8 w-3/4' />
            <Skeleton className='h-3 w-64' />
          </div>
        ) : (
          <p className='px-4 py-3.5 text-sm text-muted-foreground'>
            Snacky hasn&apos;t roasted this period yet.
          </p>
        )
      ) : (
        // keyed so each slide fades in
        <div
          key={`${slide}-${summary.updatedAt.toString()}`}
          aria-live='polite'
          className={cn("animate-in duration-300 fade-in", loading && "opacity-50")}
        >
          {onAwards ? (
            <ul className='grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0'>
              {summary.awards.map((award) => (
                <li key={award.title} className='min-w-0 space-y-0.5 px-4 py-3.5'>
                  <p className='truncate text-xs font-semibold text-primary'>{award.title}</p>
                  <p className='truncate text-base font-semibold'>{award.winner}</p>
                  <p className='text-xs text-muted-foreground'>{award.quip}</p>
                </li>
              ))}
            </ul>
          ) : (
            roast && (
              <div className='space-y-1.5 px-4 py-3.5'>
                <p className='font-heading text-xl leading-snug sm:text-2xl'>
                  <Highlight text={roast.line} />{" "}
                  <span className='text-muted-foreground italic'>{roast.aside}</span>
                </p>
                <p className='text-xs text-muted-foreground'>{summary.facts}</p>
              </div>
            )
          )}
        </div>
      )}
    </section>
  );
}

// the roast's **bold** figure or name, in the accent colour
function Highlight({ text }: { text: string }) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((chunk, index) =>
    chunk.startsWith("**") && chunk.endsWith("**") ? (
      <span key={index} className='text-primary'>
        {chunk.slice(2, -2)}
      </span>
    ) : (
      chunk
    ),
  );
}

export function SnackySummarySkeleton() {
  return (
    <section className='border bg-card'>
      <div className='flex items-center gap-2 border-b px-4 py-2.5'>
        <SnackyMark className='size-5 animate-pulse' />
        <Skeleton className='h-3 w-40' />
      </div>
      <div className='space-y-2 px-4 py-3.5'>
        <Skeleton className='h-7 w-3/4' />
        <Skeleton className='h-3 w-64' />
      </div>
    </section>
  );
}
