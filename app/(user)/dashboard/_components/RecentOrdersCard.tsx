"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";
import { CalendarDays } from "lucide-react";
import Link from "next/link";

type RecentOrder = {
  id: string;
  windowLabel: string;
  createdAt: Date;
  total: number;
  status: string;
};

type RecentOrdersCardProps = {
  orders: RecentOrder[];
};

const STATUS_COLORS: Record<string, string> = {
  approved: "text-green-700 dark:text-green-400",
  pending: "text-amber-700 dark:text-amber-300",
  rejected: "text-red-700 dark:text-red-400",
  cancelled: "text-muted-foreground",
};

export function RecentOrdersCard({ orders }: RecentOrdersCardProps) {
  if (orders.length === 0) {
    return (
      <Card size='sm'>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>

        <CardContent className='px-3 pb-4 text-center text-muted-foreground'>
          No orders yet
        </CardContent>
      </Card>
    );
  }

  return (
    <Card size='sm'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle>Recent Orders</CardTitle>

          <div className='flex items-center gap-1 text-xs text-muted-foreground'>
            <CalendarDays className='h-3 w-3' />
            <span>Last {orders.length} orders</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ul className='divide-y [&>li:first-child>a]:pt-0'>
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href='/history'
                className='grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 py-2.5 transition-colors hover:text-primary'
              >
                <span className='flex min-w-0 items-baseline gap-2'>
                  <span className='truncate font-medium'>
                    {order.windowLabel}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 text-[10px] font-semibold uppercase tracking-widest",
                      STATUS_COLORS[order.status] ?? "text-muted-foreground",
                    )}
                  >
                    {order.status}
                  </span>
                </span>
                <span className='text-right font-semibold tabular-nums text-foreground'>
                  {formatCurrency(order.total)}
                </span>
                <span className='col-span-2 text-xs text-muted-foreground'>
                  {new Date(order.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
