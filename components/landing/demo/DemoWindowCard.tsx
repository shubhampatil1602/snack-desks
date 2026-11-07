"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTime, urgencyClass } from "@/hooks/use-countdown";
import { SAMPLE_WINDOW_SECONDS } from "./sample-data";
import { useDemoCountdown } from "./use-demo-countdown";
import { orderCounts, useDemoOffice } from "./use-demo-office";

// The dashboard's ActiveWindowCard with a pretend clock. The real one closes
// its window on the server when the time runs out.
export function DemoWindowCard({ onViewOrders }: { onViewOrders?: () => void }) {
  const remaining = useDemoCountdown(SAMPLE_WINDOW_SECONDS);
  const pending = useDemoOffice((office) => office.pending);
  const counts = orderCounts(pending);
  const COUNTS = [
    ["Orders", counts.orders],
    ["Approved", counts.approved],
    ["Pending", counts.pending],
    ["Cancelled", 0],
  ] as const;

  return (
    <div className='relative overflow-hidden border bg-card'>
      <div
        className='pointer-events-none absolute inset-0 z-0 opacity-20'
        style={{
          backgroundImage: `
            repeating-linear-gradient(45deg, var(--border) 0, var(--border) 1px, transparent 1px, transparent 20px),
            repeating-linear-gradient(-45deg, var(--border) 0, var(--border) 1px, transparent 1px, transparent 20px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      <div className='relative z-10 p-4'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div className='flex items-center gap-3'>
            <h2 className='text-xl font-semibold'>Evening Snacks</h2>
            <Badge className='border-green-200 bg-green-50 px-1.5 py-1 text-green-700 dark:border-green-800 dark:bg-green-950/50 dark:text-green-400'>
              ● Active
            </Badge>
          </div>
          {onViewOrders && (
            <Button type='button' onClick={onViewOrders}>
              View Orders
            </Button>
          )}
        </div>

        <div className='mt-4 flex flex-wrap items-center justify-between gap-4'>
          <div>
            <p className='text-sm text-muted-foreground'>Opened at</p>
            <p className='font-medium'>04:30 pm</p>
          </div>

          <div className='text-center'>
            <p className={`font-mono text-3xl font-bold ${urgencyClass(remaining)}`}>
              {formatTime(remaining)}
            </p>
            <p className='text-xs text-muted-foreground'>remaining</p>
          </div>

          <div className='flex gap-6'>
            {COUNTS.map(([label, value]) => (
              <div key={label}>
                <p className='text-sm text-muted-foreground'>{label}</p>
                <p className='text-center text-xl font-bold'>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
