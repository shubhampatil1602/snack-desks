"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";

import { usePagination } from "@/hooks/use-pagination";
import { DataPagination } from "@/components/ui/data-pagination";

import { UserOrderHistory } from "@/modules/orders/user-history-queries";

import {
  OrderHistoryFilters,
  HistoryPeriod,
  HistoryStatus,
} from "@/components/orders/OrderHistoryFilters";

import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";

import { OrderHistoryDetails } from "@/components/orders/OrderHistoryDetails";

type UserHistoryTableProps = {
  orders: UserOrderHistory;
  userId: string;
};

export function UserHistoryTable({ orders, userId }: UserHistoryTableProps) {
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

    if (period === "month") {
      return (
        orderDate.getMonth() === now.getMonth() &&
        orderDate.getFullYear() === now.getFullYear()
      );
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

      <div className='border'>
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
              const total = order.items.reduce(
                (sum, item) =>
                  sum + Number(item.menuItem.price) * item.quantity,
                0,
              );

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
                      {order.orderWindow.winnerUserId === userId && (
                        <span className='bg-linear-to-r from-amber-400 via-yellow-500 to-amber-500 text-white hover:from-amber-500 hover:via-yellow-600 hover:to-amber-600 border border-amber-600 shadow-md dark:from-amber-600 dark:via-yellow-600 dark:to-amber-700 dark:border-amber-500 p-0.5 px-2 text-xs font-bold rounded-3xl'>
                          SPLIT MASTER
                        </span>
                      )}
                    </TableCell>

                    <TableCell className='px-3 py-0.5'>
                      ₹{total.toFixed(2)}
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
