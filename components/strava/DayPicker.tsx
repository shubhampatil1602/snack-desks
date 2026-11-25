"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  basePath: string; // "/admin/runs" or "/runs"
  day: string;
  firstDay: string; // the office's first run; nothing to show before it
  previous: string | null; // null on firstDay
  next: string | null; // null on today
};

export function DayPicker({ basePath, day, firstDay, previous, next }: Props) {
  const router = useRouter();

  return (
    <div className='flex items-center gap-2'>
      {previous ? (
        <Button variant='outline' size='icon-sm' asChild>
          <Link href={`${basePath}?day=${previous}`} aria-label='Previous day'>
            <ChevronLeft />
          </Link>
        </Button>
      ) : (
        <Button variant='outline' size='icon-sm' disabled aria-label='Previous day'>
          <ChevronLeft />
        </Button>
      )}
      <input
        type='date'
        value={day}
        min={firstDay}
        max={next ? undefined : day}
        onChange={(event) => {
          if (event.target.value) router.push(`${basePath}?day=${event.target.value}`);
        }}
        className='h-9 border border-input bg-background px-3 text-sm'
        aria-label='Day'
      />
      {next ? (
        <Button variant='outline' size='icon-sm' asChild>
          <Link href={`${basePath}?day=${next}`} aria-label='Next day'>
            <ChevronRight />
          </Link>
        </Button>
      ) : (
        <Button variant='outline' size='icon-sm' disabled aria-label='Next day'>
          <ChevronRight />
        </Button>
      )}
    </div>
  );
}
