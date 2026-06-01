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

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { usePagination } from "@/hooks/use-pagination";
import { DataPagination } from "@/components/ui/data-pagination";
import { UserOrderHistory } from "@/modules/orders/user-history-queries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsTrigger, TabsList } from "@/components/ui/tabs";

type UserHistoryTableProps = {
  orders: UserOrderHistory;
};

export function UserHistoryTable({ orders }: UserHistoryTableProps) {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [period, setPeriod] = useState<"all" | "today" | "week" | "month">(
    "all",
  );
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "rejected" | "cancelled"
  >("all");
  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== "all" && order.status !== statusFilter) {
      return false;
    }
    if (period === "all") return true;

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
    <div className=''>
      <div className='flex justify-between mb-3'>
        <Tabs
          value={period}
          onValueChange={(value) => setPeriod(value as typeof period)}
        >
          <TabsList>
            <TabsTrigger value='all'>All</TabsTrigger>
            <TabsTrigger value='today'>Today</TabsTrigger>
            <TabsTrigger value='week'>This Week</TabsTrigger>
            <TabsTrigger value='month'>This Month</TabsTrigger>
          </TabsList>
        </Tabs>
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as typeof statusFilter)
          }
        >
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='Status' />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value='all'>All Status</SelectItem>
            <SelectItem value='pending'>Pending</SelectItem>
            <SelectItem value='approved'>Approved</SelectItem>
            <SelectItem value='rejected'>Rejected</SelectItem>
            <SelectItem value='cancelled'>Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>
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
                (sum: number, item) =>
                  sum + Number(item.menuItem.price) * item.quantity,
                0,
              );

              const expanded = expandedOrderId === order.id;

              return (
                <Fragment key={order.id}>
                  <TableRow>
                    <TableCell className='px-3 py-0.5'>
                      {new Date(order.createdAt).toLocaleDateString("en-IN")}
                    </TableCell>

                    <TableCell className='px-3 py-0.5'>
                      {order.orderWindow.label}
                    </TableCell>

                    <TableCell className='px-3 py-0.5'>
                      ₹{total.toFixed(2)}
                    </TableCell>

                    <TableCell className='px-3 py-0.5'>
                      <Badge variant='outline'>{order.status}</Badge>
                    </TableCell>

                    <TableCell className='px-3 py-0.5'>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() =>
                          setExpandedOrderId(expanded ? null : order.id)
                        }
                      >
                        {expanded ? <ChevronUp /> : <ChevronDown />}
                      </Button>
                    </TableCell>
                  </TableRow>

                  {expanded && (
                    <TableRow>
                      <TableCell colSpan={5} className='bg-muted/60'>
                        <div className='space-y-2'>
                          {order.items.map((item) => (
                            <div key={item.id} className='flex justify-between'>
                              <span>
                                {item.menuItem.name} × {item.quantity}
                              </span>

                              <span>
                                ₹
                                {(
                                  Number(item.menuItem.price) * item.quantity
                                ).toFixed(2)}
                              </span>
                            </div>
                          ))}

                          <div className='border-t pt-2 flex justify-between font-medium'>
                            <span>Total</span>
                            <span>₹{total.toFixed(2)}</span>
                          </div>
                        </div>
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
