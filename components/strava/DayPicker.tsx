"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  basePath: string; // "/admin/runs" or "/runs"
  day: string;
  previous: string;
  next: string | null; // null on today
};

export function DayPicker({ basePath, day, previous, next }: Props) {
  const router = useRouter();

  return (
    <div className='flex items-center gap-2'>
      <Button variant='outline' size='icon-sm' asChild>
        <Link href={`${basePath}?day=${previous}`} aria-label='Previous day'>
          <ChevronLeft />
        </Link>
      </Button>
      <input
        type='date'
        value={day}
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
