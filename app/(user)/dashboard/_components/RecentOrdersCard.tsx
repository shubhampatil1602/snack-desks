"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

function getStatusVariant(status: string) {
  switch (status) {
    case "approved":
      return "default";

    case "pending":
      return "secondary";

    case "rejected":
    case "cancelled":
      return "destructive";

    default:
      return "outline";
  }
}

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
        <div className='space-y-2'>
          {orders.map((order) => (
            <Link
              key={order.id}
              href='/orders'
              className='block border-b last:border-0'
            >
              <div className='flex items-center justify-between pt-1 pb-2'>
                <div className='flex-1'>
                  <div className='flex items-center gap-2 mb-0.5'>
                    <p className='font-medium'>{order.windowLabel}</p>

                    <Badge variant={getStatusVariant(order.status)}>
                      {order.status}
                    </Badge>
                  </div>

                  <p className='text-sm text-muted-foreground'>
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <p className='font-semibold'>₹{order.total.toFixed(2)}</p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
