"use client";

import { Fragment, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { ChevronDown, ChevronRight, Dot, Search } from "lucide-react";

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
import { AdminEditOrderDialog } from "./AdminEditOrderDialog";
import { MenuItem } from "@/types/menu";
import { HistoryOrderActions } from "./HistoryOrderActions";
import { OrderWindowSummaryDialog } from "./OrderWindowSummaryDialog";
import { OrderWindowUserSummaryDialog } from "./OrderWindowUserSummaryDialog";
import { DeleteOrderWindowButton } from "@/components/admins/DeleteOrderWindowButton";
import { SpinWheelButton } from "./SpinWheelButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { markAsPaidAction } from "@/actions/spin-wheel";
import { AddLateOrderDialog } from "./AddLateOrderDialog";

type AdminWindowHistoryProps = {
  windows: AdminWindowHistoryType;
  menuItems: MenuItem[];
};

export function AdminWindowHistory({
  windows,
  menuItems,
}: AdminWindowHistoryProps) {
  const [expandedWindows, setExpandedWindows] = useState<
    Record<string, boolean>
  >(() => ({
    [windows[0]?.id]: true,
  }));
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>(
    {},
  );
  const [search, setSearch] = useState("");

  function toggleOrder(orderId: string) {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  }
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
        order.items
          .filter((item) => !item.replacementApplied)
          .reduce(
            (itemSum, item) =>
              itemSum + Number(item.menuItem.price) * item.quantity,
            0,
          ),
      0,
    );
    const revenueB = b.orders.reduce(
      (sum, order) =>
        sum +
        order.items
          .filter((item) => !item.replacementApplied)
          .reduce(
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
      <div className=''>
        <OrderHistoryFilters
          period={period}
          statusFilter={statusFilter}
          onPeriodChange={setPeriod}
          onStatusChange={setStatusFilter}
        />

        <div className='flex items-center justify-between gap-2'>
          <div className='relative'>
            <Search className='absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground' />
            <Input
              placeholder='Search employee...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='w-[220px] pl-8 h-8 text-sm'
            />
          </div>

          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value as typeof sortBy)}
          >
            <SelectTrigger className='w-[150px] h-8 text-sm'>
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

      {/* Windows List - Tighter spacing */}
      <div>
        {pagination.paginatedData.map((window) => {
          const isExpanded = expandedWindows[window.id];
          const windowRevenue = window.orders
            .filter((o) => o.status !== "cancelled")
            .reduce(
              (sum, order) =>
                sum +
                order.items
                  .filter((item) => !item.replacementApplied)
                  .reduce(
                    (itemSum, item) =>
                      itemSum + Number(item.menuItem.price) * item.quantity,
                    0,
                  ),
              0,
            );

          const allOrdersExpanded =
            window.orders.length > 0 &&
            window.orders.every((o) => expandedOrders[o.id]);
          const toggleAllOrders = () => {
            setExpandedOrders((prev) => {
              const next = { ...prev };
              window.orders.forEach((o) => {
                next[o.id] = !allOrdersExpanded;
              });
              return next;
            });
          };

          const isLocked = window.isLocked;
          const hasUnspunLateOrders = window.orders.some(o => o.createdByAdmin && (!window.lastSpunAt || new Date(o.createdAt) > new Date(window.lastSpunAt)));

          return (
            <Fragment key={window.id}>
              {/* Window Card */}
              <div className='border-collapse border my-3'>
                {/* Window Header */}
                <div className='flex items-center justify-between px-3 py-2 bg-muted/20 overflow-x-auto'>
                  <div className='flex items-center gap-2 w-xl'>
                    <button
                      className='p-0'
                      onClick={() => toggleWindow(window.id)}
                    >
                      {isExpanded ? (
                        <ChevronDown className='h-3.5 w-3.5' />
                      ) : (
                        <ChevronRight className='h-3.5 w-3.5' />
                      )}
                    </button>
                    <button
                      className='flex items-center gap-2 cursor-pointer'
                      onClick={() => toggleWindow(window.id)}
                    >
                      <div className='ml-3 flex flex-col'>
                        <span className='text-sm font-medium'>
                          {new Date(window.createdAt).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </span>
                        <Badge className='text-[10px] text-muted-foreground text-left'>
                          {new Date(window.createdAt).toLocaleTimeString(
                            "en-IN",
                            {
                              hour: "numeric",
                              minute: "numeric",
                              hour12: true,
                            },
                          )}
                        </Badge>
                      </div>
                      <span className='text-muted-foreground text-xs'>·</span>
                      <span className='text-sm font-medium line-clamp-1'>
                        {window.label}
                      </span>
                      <span className='text-muted-foreground text-xs'>·</span>
                      {window.paid ? (
                        <Badge className='bg-linear-to-r from-emerald-400 via-green-500 to-emerald-500 text-white hover:from-emerald-500 hover:via-emerald-600 hover:to-emerald-600 border border-emerald-600 shadow-md dark:from-emerald-600 dark:via-emerald-600 dark:to-emerald-700 dark:border-emerald-500 rounded-full py-0.5 px-2'>
                          Paid
                        </Badge>
                      ) : (
                        <Badge className='bg-linear-to-r from-red-400 via-orange-500 to-red-500 text-white hover:from-red-500 hover:via-red-600 hover:to-red-600 border border-red-600 shadow-md dark:from-red-600 dark:via-red-600 dark:to-red-700 dark:border-red-500 rounded-full py-0.5 px-2'>
                          Unpaid
                        </Badge>
                      )}
                    </button>
                  </div>

                  <div className='flex items-center justify-end gap-2 w-xl'>
                    {window.winnerUserId && !window.paid && !hasUnspunLateOrders && (
                      <Button
                        size='sm'
                        onClick={() => markAsPaidAction(window.id)}
                      >
                        Mark as Paid
                      </Button>
                    )}
                    <SpinWheelButton
                      windowId={window.id}
                      winnerName={window.winnerUser?.name ?? null}
                      hasUnspunLateOrders={hasUnspunLateOrders}
                    />
                    <OrderWindowSummaryDialog window={window} />
                    <OrderWindowUserSummaryDialog window={window} />
                    {!isLocked && (
                      <AddLateOrderDialog
                        windowId={window.id}
                        windowLabel={window.label}
                        menuItems={menuItems}
                      />
                    )}

                    <DeleteOrderWindowButton
                      windowId={window.id}
                      windowLabel={window.label}
                    />
                  </div>
                </div>

                {/* Orders Table */}
                {isExpanded && (
                  <div className='border-t'>
                    <Table>
                      <TableHeader>
                        <TableRow className='hover:bg-transparent bg-muted/10'>
                          <TableHead className='w-[30px] py-2 text-xs' />
                          <TableHead className='py-2 text-xs font-medium'>
                            User
                          </TableHead>
                          <TableHead className='py-2 text-xs font-medium'>
                            Items
                          </TableHead>
                          <TableHead className='py-2 text-xs font-medium text-center'>
                            <div className='space-x-2'>
                              <span> {formatCurrency(windowRevenue)}</span>
                              <span className='text-muted-foreground text-xs'>
                                ·
                              </span>
                              <span>{window.orders.length} orders</span>
                            </div>
                          </TableHead>
                          <TableHead className='py-2 text-xs font-medium'>
                            Status
                          </TableHead>
                          <TableHead className='py-2 text-center'>
                            <Button
                              type='button'
                              variant='ghost'
                              size='xs'
                              className='text-[10px] h-6 px-1.5 font-bold cursor-pointer hover:bg-muted border border-muted-foreground/10'
                              onClick={toggleAllOrders}
                            >
                              {allOrdersExpanded
                                ? "Collapse All"
                                : "Expand All"}
                            </Button>
                          </TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {window.orders.map((order) => {
                          const activeItems = order.items.filter(
                            (item) => !item.replacementApplied,
                          );
                          const hasReplacements = order.items.some(
                            (item) => item.replacementApplied,
                          );
                          const hasAlternativePreferences = order.items.some(
                            (item) =>
                              !item.replacementApplied &&
                              item.replacementPreferences &&
                              item.replacementPreferences.length > 0,
                          );
                          const total = activeItems.reduce(
                            (sum, item) =>
                              sum + Number(item.menuItem.price) * item.quantity,
                            0,
                          );
                          const isExpandedOrder = !!expandedOrders[order.id];
                          const totalItems = activeItems.reduce(
                            (sum, item) => sum + item.quantity,
                            0,
                          );

                          return (
                            <Fragment key={order.id}>
                              <TableRow
                                className={`cursor-pointer ${
                                  isExpandedOrder ? "border-b-0" : ""
                                } hover:bg-muted/5`}
                              >
                                <TableCell className='pl-3 py-2'>
                                  <Dot className='h-3 w-3 text-muted-foreground' />
                                </TableCell>

                                <TableCell
                                  className='py-2 text-sm font-medium hover:underline'
                                  onClick={() => toggleOrder(order.id)}
                                >
                                  <div className='flex items-center gap-2'>
                                    <span>{order.user.name}</span>
                                    {order.createdByAdmin && (
                                      <Badge
                                        variant='outline'
                                        className='text-[10px] border-cyan-500 text-cyan-600 bg-cyan-50 dark:bg-cyan-950/20 rounded-full py-0 px-1.5'
                                      >
                                        Late Order
                                      </Badge>
                                    )}
                                    {hasReplacements ? (
                                      <Badge
                                        variant='outline'
                                        className='text-[10px] border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/20 rounded-full py-0 px-1.5'
                                      >
                                        Alternative Used
                                      </Badge>
                                    ) : hasAlternativePreferences ? (
                                      <span
                                        className='w-1.5 h-1.5 rounded-full bg-amber-500 inline-block shrink-0 animate-pulse'
                                        title='Alternative preferences available'
                                      />
                                    ) : null}
                                  </div>
                                </TableCell>

                                <TableCell
                                  className='py-2 text-xs text-muted-foreground'
                                  onClick={() => toggleOrder(order.id)}
                                >
                                  {totalItems} item{totalItems !== 1 ? "s" : ""}
                                </TableCell>

                                <TableCell className='py-2 text-sm text-center font-medium'>
                                  {formatCurrency(total)}
                                </TableCell>

                                <TableCell className='py-2'>
                                  <OrderStatusBadge status={order.status} />
                                </TableCell>

                                <TableCell className='py-2 text-center'>
                                  <div className='flex items-center justify-center gap-3'>
                                    {!isLocked &&
                                      order.status === "approved" && (
                                        <AdminEditOrderDialog
                                          orderId={order.id}
                                          userName={order.user.name}
                                          items={order.items.filter(
                                            (item) => !item.replacementApplied,
                                          )}
                                          menuItems={menuItems}
                                        />
                                      )}
                                    {!isLocked &&
                                      (order.status === "approved" ||
                                        order.status === "rejected") && (
                                        <HistoryOrderActions
                                          orderId={order.id}
                                          status={order.status}
                                        />
                                      )}
                                  </div>
                                </TableCell>
                              </TableRow>

                              {isExpandedOrder && (
                                <TableRow className='hover:bg-transparent'>
                                  <TableCell className='py-0' />
                                  <TableCell colSpan={5} className='pb-3 pt-0'>
                                    <OrderHistoryDetails
                                      items={order.items}
                                      isAdmin={true}
                                    />
                                  </TableCell>
                                </TableRow>
                              )}
                            </Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </Fragment>
          );
        })}
      </div>

      <DataPagination {...pagination} />
    </div>
  );
}
