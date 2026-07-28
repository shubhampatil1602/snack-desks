"use client";

import { Fragment, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { ChevronDown, ChevronUp, Info } from "lucide-react";

import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { ShopBreakdownInfo } from "@/components/orders/ShopBreakdownInfo";

import { usePagination } from "@/hooks/use-pagination";
import { DataPagination } from "@/components/ui/data-pagination";

import {
  UserOrderHistory,
} from "@/modules/orders/user-history-queries";
import { AdminWindowHistory } from "@/modules/orders/admin-history-queries";

import {
  HistoryPeriod,
  HistoryStatus,
  OrderHistoryFilters,
} from "@/components/orders/OrderHistoryFilters";

import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";

import { OrderHistoryDetails } from "@/components/orders/OrderHistoryDetails";
import { Badge } from "@/components/ui/badge";
import { OrderWindowUserSummaryDialog } from "../../../admin/history/_components/OrderWindowUserSummaryDialog";
import { OrderWindowSummaryDialog } from "@/app/admin/history/_components/OrderWindowSummaryDialog";

type UserHistoryTableProps = {
  orders: UserOrderHistory;
};

export function UserHistoryTable({ orders }: UserHistoryTableProps) {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const [period, setPeriod] = useState<HistoryPeriod>("all");
  const [statusFilter, setStatusFilter] = useState<HistoryStatus>("all");

  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== "all" && order.status !== statusFilter) {
      return false;
    }

    if (period === "all") {
      return true;
    }

    const orderDate = new Date(order.createdAt);
    const now = new Date();

    if (period === "today") {
      return orderDate.toDateString() === now.toDateString();
    }

    if (period === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);

      return orderDate >= weekAgo;
    }

    return true;
  });

  const pagination = usePagination({
    data: filteredOrders,
    itemsPerPage: 10,
  });

  return (
    <div>
      <OrderHistoryFilters
        period={period}
        statusFilter={statusFilter}
        onPeriodChange={setPeriod}
        onStatusChange={setStatusFilter}
      />

      {filteredOrders.length > 0 && (
        <div className='flex items-center h-10 px-3 border bg-muted/10 text-sm w-fit mb-4 mt-2'>
          <span className='text-muted-foreground mr-1.5'>Total Spend:</span>
          <span className='font-semibold'>
            {formatCurrency(
              filteredOrders.reduce(
                (sum, order) =>
                  sum +
                  order.items
                    .filter((i) => !i.replacementApplied)
                    .reduce(
                      (itemSum, item) =>
                        itemSum + Number(item.menuItem.price) * item.quantity,
                      0,
                    ),
                0,
              ),
            )}
          </span>
          <ShopBreakdownInfo
            breakdown={(() => {
              const shopTotals: Record<string, number> = {};
              filteredOrders.forEach((order) => {
                order.items
                  .filter((item) => !item.replacementApplied)
                  .forEach((item) => {
                    const itemTotal =
                      Number(item.menuItem.price) * item.quantity;
                    const shopName = item.menuItem.shop?.name || "Unknown Shop";
                    shopTotals[shopName] =
                      (shopTotals[shopName] || 0) + itemTotal;
                  });
              });
              return shopTotals;
            })()}
            className='ml-1.5'
          />
        </div>
      )}

      <div className='border overflow-x-auto'>
        <Table>
          <TableHeader className='bg-muted'>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Window</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className='w-[80px]'>Expand</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {pagination.paginatedData.map((order) => {
              const hasReplacements = order.items.some(
                (item) => item.replacementApplied,
              );
              const shopTotals: Record<string, number> = {};
              let total = 0;
              order.items
                .filter((item) => !item.replacementApplied)
                .forEach((item) => {
                  const itemTotal = Number(item.menuItem.price) * item.quantity;
                  total += itemTotal;
                  const shopName = item.menuItem.shop?.name || "Unknown Shop";
                  shopTotals[shopName] =
                    (shopTotals[shopName] || 0) + itemTotal;
                });

              const expanded = expandedOrderId === order.id;

              return (
                <Fragment key={order.id}>
                  <TableRow
                    onClick={() =>
                      setExpandedOrderId(expanded ? null : order.id)
                    }
                  >
                    <TableCell className='px-3 py-0.5'>
                      {new Date(order.createdAt).toLocaleDateString("en-IN")}
                    </TableCell>

                    <TableCell className='px-3 py-0.5'>
                      <span className='mr-3'>{order.orderWindow.label}</span>
                      {order.createdByAdmin && (
                        <Badge
                          variant='outline'
                          className='text-[10px] border-cyan-500 text-cyan-600 bg-cyan-50 dark:bg-cyan-950/20 rounded-full py-0 px-1.5'
                        >
                          Late Order
                        </Badge>
                      )}
                      {hasReplacements && (
                        <Badge
                          variant='outline'
                          className='mr-2 text-[10px] border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/20 rounded-full'
                        >
                          Alternative Used
                        </Badge>
                      )}
                      {order.orderWindow.winnerUserId && (
                        <div className='inline-flex items-center gap-1.5 align-middle'>
                          <span className='bg-linear-to-r from-amber-400 via-yellow-500 to-amber-500 text-white hover:from-amber-500 hover:via-yellow-600 hover:to-amber-600 border border-amber-600 shadow-md dark:from-amber-600 dark:via-yellow-600 dark:to-amber-700 dark:border-amber-500 p-0.5 px-2 text-xs font-bold rounded-3xl'>
                            SPLIT MASTER:{" "}
                            {order.orderWindow.winnerUser?.name.toUpperCase()}
                          </span>
                          {order.orderWindow.winnerUserId === order.userId && (
                            <div onClick={(e) => e.stopPropagation()}>
                              <OrderWindowUserSummaryDialog
                                window={order.orderWindow}
                              />
                            </div>
                          )}
                          {(order.canViewGlobalSplit ||
                            order.orderWindow.winnerUserId ===
                              order.userId) && (
                            <div onClick={(e) => e.stopPropagation()}>
                              <OrderWindowSummaryDialog
                                window={
                                  order.orderWindow as unknown as AdminWindowHistory[number]
                                }
                                isUserView={true}
                              />
                            </div>
                          )}
                        </div>
                      )}
                      <span className='text-muted-foreground text-xs mx-1'></span>
                      {order.orderWindow.paid ? (
                        <Badge className='bg-linear-to-r from-emerald-400 via-green-500 to-emerald-500 text-white hover:from-emerald-500 hover:via-emerald-600 hover:to-emerald-600 border border-emerald-600 shadow-md dark:from-emerald-600 dark:via-emerald-600 dark:to-emerald-700 dark:border-emerald-500 rounded-full py-0.5 px-2'>
                          Paid
                        </Badge>
                      ) : (
                        <Badge className='bg-linear-to-r from-red-400 via-orange-500 to-red-500 text-white hover:from-red-500 hover:via-red-600 hover:to-red-600 border border-red-600 shadow-md dark:from-red-600 dark:via-red-600 dark:to-red-700 dark:border-red-500 rounded-full py-0.5 px-2'>
                          Unpaid
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className='px-3 py-0.5'>
                      <div className='flex items-center gap-1.5'>
                        <span className='font-medium'>
                          {formatCurrency(total)}
                        </span>
                        <ShopBreakdownInfo
                          breakdown={shopTotals}
                          className='-ml-0.5'
                        />
                      </div>
                    </TableCell>

                    <TableCell className='px-3 py-0.5'>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>

                    <TableCell className='px-3 py-0.5'>
                      <Button variant='ghost' size='icon'>
                        {expanded ? <ChevronUp /> : <ChevronDown />}
                      </Button>
                    </TableCell>
                  </TableRow>

                  {expanded && (
                    <TableRow>
                      <TableCell colSpan={5} className='bg-muted/60'>
                        <OrderHistoryDetails items={order.items} />
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>

        <DataPagination {...pagination} />
      </div>
    </div>
  );
}
