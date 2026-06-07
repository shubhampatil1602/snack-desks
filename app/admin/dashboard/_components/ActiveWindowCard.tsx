"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCountdown, formatTime, urgencyClass } from "@/hooks/use-countdown";
import { useRouter } from "next/navigation";

type ActiveWindowCardProps = {
  window: {
    id: string;
    label: string;
    startsAt: Date;
    endsAt: Date | null;
    orders: {
      status: string;
    }[];
  } | null;
  serverNow: number;
};

export function ActiveWindowCard({ window, serverNow }: ActiveWindowCardProps) {
  const router = useRouter();

  const remaining = useCountdown(window?.endsAt ?? null, serverNow);

  if (!window) {
    return (
      <div className='border bg-card p-6 relative overflow-hidden'>
        {/* Diagonal Grid */}
        <div
          className='absolute inset-0 z-0 pointer-events-none'
          style={{
            backgroundImage: `
            repeating-linear-gradient(45deg, rgba(255, 0, 100, 0.05) 0, rgba(255, 0, 100, 0.05) 1px, transparent 1px, transparent 20px),
            repeating-linear-gradient(-45deg, rgba(255, 0, 100, 0.05) 0, rgba(255, 0, 100, 0.05) 1px, transparent 1px, transparent 20px)
          `,
            backgroundSize: "40px 40px",
          }}
        />

        <div className='relative z-10'>
          <h2 className='text-xl font-semibold'>No Active Order Window</h2>
          <p className='text-sm text-muted-foreground mt-1 mb-4'>
            Create a new order window to start accepting orders.
          </p>
          <Button onClick={() => router.push("/admin/order-window")}>
            Create Window
          </Button>
        </div>
      </div>
    );
  }

  const approved = window.orders.filter((o) => o.status === "approved").length;
  const pending = window.orders.filter((o) => o.status === "pending").length;

  return (
    <div className='border bg-card relative overflow-hidden'>
      {/* Diagonal Grid with Light */}
      <div
        className='absolute inset-0 z-0 pointer-events-none'
        style={{
          backgroundImage: `
          repeating-linear-gradient(45deg, rgba(0, 0, 0, 0.05) 0, rgba(0, 0, 0, 0.05) 1px, transparent 1px, transparent 20px),
          repeating-linear-gradient(-45deg, rgba(0, 0, 0, 0.05) 0, rgba(0, 0, 0, 0.05) 1px, transparent 1px, transparent 20px)
        `,
          backgroundSize: "40px 40px",
        }}
      />

      <div className='relative z-10 p-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <h2 className='text-xl font-semibold'>{window.label}</h2>
            <Badge className='bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400 border-green-200 dark:border-green-800 px-1.5 py-1'>
              ● Active
            </Badge>
          </div>

          <Button onClick={() => router.push("/admin/order-window")}>
            View Orders
          </Button>
        </div>

        <div className='flex items-center justify-between mt-4'>
          <div>
            <p className='text-sm text-muted-foreground'>Opened at</p>
            <p className='font-medium'>
              {new Date(window.startsAt).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          {remaining !== null && (
            <div className='text-center'>
              <p
                className={`text-3xl font-mono font-bold ${urgencyClass(remaining)}`}
              >
                {formatTime(remaining)}
              </p>
              <p className='text-xs text-muted-foreground'>remaining</p>
            </div>
          )}

          <div className='flex gap-6'>
            <div>
              <p className='text-sm text-muted-foreground'>Orders</p>
              <p className='text-xl font-bold text-center'>
                {window.orders.length}
              </p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Approved</p>
              <p className='text-xl font-bold text-center'>{approved}</p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Pending</p>
              <p className='text-xl font-bold text-center'>{pending}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
