"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";
import { CalendarDays } from "lucide-react";
import Link from "next/link";

type RecentWindow = {
  id: string;
  label: string;
  createdAt: Date;
  status: string;
  ordersCount: number;
  revenue: number;
};

type RecentWindowsCardProps = {
  windows: RecentWindow[];
};

export function RecentWindowsCard({ windows }: RecentWindowsCardProps) {
  if (windows.length === 0) {
    return (
      <Card size='sm'>
        <CardHeader>
          <CardTitle>Recent Order Windows</CardTitle>
        </CardHeader>
        <CardContent className='px-3 pb-4 text-center text-muted-foreground'>
          No windows found
        </CardContent>
      </Card>
    );
  }

  return (
    <Card size='sm'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle>Recent Order Windows</CardTitle>
          <div className='flex items-center gap-1 text-xs text-muted-foreground'>
            <CalendarDays className='h-3 w-3' />
            <span>Last {windows.length} windows</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ul className='divide-y [&>li:first-child>a]:pt-0'>
          {windows.map((window) => (
            <li key={window.id}>
              <Link
                href={
                  window.status === "active"
                    ? "/admin/order-window"
                    : "/admin/history"
                }
                className='grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 py-2.5 transition-colors hover:text-primary'
              >
                <span className='flex min-w-0 items-baseline gap-2'>
                  <span className='truncate font-medium'>{window.label}</span>
                  <span
                    className={cn(
                      "shrink-0 text-[10px] font-semibold uppercase tracking-widest",
                      window.status === "active"
                        ? "text-green-700 dark:text-green-400"
                        : "text-muted-foreground",
                    )}
                  >
                    {window.status}
                  </span>
                </span>
                <span className='text-right font-semibold tabular-nums text-foreground'>
                  {formatCurrency(window.revenue)}
                </span>
                <span className='text-xs text-muted-foreground'>
                  {new Date(window.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <span className='text-right text-xs text-muted-foreground tabular-nums'>
                  {window.ordersCount}{" "}
                  {window.ordersCount === 1 ? "order" : "orders"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
