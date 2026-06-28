"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Package, IndianRupee } from "lucide-react";
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

function getStatusVariant(status: string) {
  switch (status) {
    case "active":
      return "default";
    case "closed":
      return "secondary";
    default:
      return "outline";
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400";
    case "closed":
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    default:
      return "";
  }
}

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
        <div className='space-y-2'>
          {windows.map((window) => (
            <Link
              key={window.id}
              href={
                window.status === "active"
                  ? "/admin/order-window"
                  : "/admin/history"
              }
              className='block border-b last:border-0'
            >
              <div className='flex items-center justify-between pt-1 pb-2'>
                <div className='flex-1'>
                  <div className='flex items-center gap-2 mb-0.5'>
                    <p className='font-medium'>{window.label}</p>
                    <Badge
                      variant={getStatusVariant(window.status)}
                      className={getStatusColor(window.status)}
                    >
                      {window.status}
                    </Badge>
                  </div>

                  <p className='text-sm text-muted-foreground'>
                    {new Date(window.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div className='text-right'>
                  <div className='flex items-center gap-1 justify-end'>
                    <IndianRupee className='h-3 w-3 text-muted-foreground' />
                    <p className='font-semibold'>
                      {formatCurrency(window.revenue)}
                    </p>
                  </div>

                  <div className='flex items-center gap-1 justify-end mt-0.5'>
                    <Package className='h-3 w-3 text-muted-foreground' />
                    <p className='text-sm text-muted-foreground'>
                      {window.ordersCount} orders
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
