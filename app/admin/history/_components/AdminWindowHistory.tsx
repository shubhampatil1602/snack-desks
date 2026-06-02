"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight, Dot } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePagination } from "@/hooks/use-pagination";
import { DataPagination } from "@/components/ui/data-pagination";

import { AdminWindowHistory as AdminWindowHistoryType } from "@/modules/orders/admin-history-queries";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { OrderHistoryDetails } from "@/components/orders/OrderHistoryDetails";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  OrderHistoryFilters,
  HistoryPeriod,
  HistoryStatus,
} from "@/components/orders/OrderHistoryFilters";

type AdminWindowHistoryProps = {
  windows: AdminWindowHistoryType;
};

export function AdminWindowHistory({ windows }: AdminWindowHistoryProps) {
  const [expandedWindows, setExpandedWindows] = useState<
    Record<string, boolean>
  >(() => ({
    [windows[0]?.id]: true,
  }));
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<HistoryPeriod>("all");
  const [statusFilter, setStatusFilter] = useState<HistoryStatus>("all");
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "revenue" | "orders"
  >("newest");
  const processedWindows = windows
    .map((window) => ({
      ...window,
      orders: window.orders.filter((order) => {
        if (
          search &&
          !order.user.name.toLowerCase().includes(search.toLowerCase())
        ) {
          return false;
        }

        if (statusFilter !== "all" && order.status !== statusFilter) {
          return false;
        }

        return true;
      }),
    }))
    .filter((window) => window.orders.length > 0)
    .filter((window) => {
      if (period === "all") return true;

      const windowDate = new Date(window.createdAt);
      const now = new Date();

      if (period === "today") {
        return windowDate.toDateString() === now.toDateString();
      }

      if (period === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);

        return windowDate >= weekAgo;
      }

      if (period === "month") {
        return (
          windowDate.getMonth() === now.getMonth() &&
          windowDate.getFullYear() === now.getFullYear()
        );
      }

      return true;
    });

  const sortedWindows = [...processedWindows];

  sortedWindows.sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }

    if (sortBy === "oldest") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }

    if (sortBy === "orders") {
      return b.orders.length - a.orders.length;
    }

    const revenueA = a.orders.reduce(
      (sum, order) =>
        sum +
        order.items.reduce(
          (itemSum, item) =>
            itemSum + Number(item.menuItem.price) * item.quantity,
          0,
        ),
      0,
    );

    const revenueB = b.orders.reduce(
      (sum, order) =>
        sum +
        order.items.reduce(
          (itemSum, item) =>
            itemSum + Number(item.menuItem.price) * item.quantity,
          0,
        ),
      0,
    );

    return revenueB - revenueA;
  });

  const pagination = usePagination({
    data: sortedWindows,
    itemsPerPage: 5,
  });

  function toggleWindow(windowId: string) {
    setExpandedWindows((prev) => ({
      ...prev,
      [windowId]: !prev[windowId],
    }));
  }

  return (
    <div className='space-y-4'>
      <div className='space-y-3'>
        <OrderHistoryFilters
          period={period}
          statusFilter={statusFilter}
          onPeriodChange={setPeriod}
          onStatusChange={setStatusFilter}
        />

        <div className='flex justify-between gap-3'>
          <Input
            placeholder='Search employee...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='max-w-sm'
          />

          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value as typeof sortBy)}
          >
            <SelectTrigger className='w-[200px]'>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value='newest'>Newest First</SelectItem>
              <SelectItem value='oldest'>Oldest First</SelectItem>
              <SelectItem value='revenue'>Highest Revenue</SelectItem>
              <SelectItem value='orders'>Most Orders</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className='border'>
        <Table>
          <TableHeader>
            <TableRow className='hover:bg-transparent border-b'>
              <TableHead className='w-[28px]' />
              <TableHead className='text-xs uppercase tracking-wide'>
                User
              </TableHead>
              <TableHead className='text-xs uppercase tracking-wide'>
                Total
              </TableHead>
              <TableHead className='text-xs uppercase tracking-wide'>
                Status
              </TableHead>
              <TableHead className='w-[40px]' />
            </TableRow>
          </TableHeader>

          <TableBody>
            {pagination.paginatedData.map((window) => {
              const isExpanded = expandedWindows[window.id];
              const windowRevenue = window.orders
                .filter((o) => o.status !== "cancelled")
                .reduce(
                  (sum, order) =>
                    sum +
                    order.items.reduce(
                      (itemSum, item) =>
                        itemSum + Number(item.menuItem.price) * item.quantity,
                      0,
                    ),
                  0,
                );

              return (
                <Fragment key={window.id}>
                  {/* Window group header row */}
                  <TableRow
                    className='cursor-pointer select-none bg-muted/50 hover:bg-muted/70'
                    onClick={() => toggleWindow(window.id)}
                  >
                    <TableCell className='pl-4 pr-0 text-center py-4'>
                      {isExpanded ? (
                        <ChevronDown className='h-3.5 w-3.5 text-muted-foreground' />
                      ) : (
                        <ChevronRight className='h-3.5 w-3.5 text-muted-foreground' />
                      )}
                    </TableCell>

                    <TableCell colSpan={4} className='py-4'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <p className='font-semibold leading-none text-foreground'>
                            {new Date(window.createdAt).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}{" "}
                            · {window.label} Window
                          </p>
                        </div>
                        <div className='text-right'>
                          <p className='font-semibold leading-none text-foreground'>
                            ₹{windowRevenue.toFixed(2)} · {window.orders.length}{" "}
                            orders
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Order rows */}
                  {isExpanded &&
                    window.orders.map((order) => {
                      const total = order.items.reduce(
                        (sum, item) =>
                          sum + Number(item.menuItem.price) * item.quantity,
                        0,
                      );
                      const isExpandedOrder = expandedOrderId === order.id;

                      return (
                        <Fragment key={order.id}>
                          <TableRow
                            className={`cursor-pointer ${
                              isExpandedOrder ? "border-b-0" : ""
                            }`}
                            onClick={() =>
                              setExpandedOrderId(
                                isExpandedOrder ? null : order.id,
                              )
                            }
                          >
                            <TableCell className='py-2 pr-0'>
                              <Dot className='size-5' />
                            </TableCell>

                            <TableCell className='py-2 text-sm font-medium'>
                              {order.user.name}
                            </TableCell>

                            <TableCell className='py-2 text-sm'>
                              ₹{total.toFixed(2)}
                            </TableCell>

                            <TableCell className='py-2'>
                              <OrderStatusBadge status={order.status} />
                            </TableCell>

                            <TableCell />
                          </TableRow>

                          {isExpandedOrder && (
                            <TableRow className='hover:bg-transparent'>
                              <TableCell className='py-0' />
                              <TableCell colSpan={4} className='pb-3 pt-1'>
                                <OrderHistoryDetails items={order.items} />
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      );
                    })}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <DataPagination {...pagination} />
    </div>
  );
}
