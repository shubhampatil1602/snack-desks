"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { approvePendingOrdersAction } from "@/actions/orders";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LiveOrder } from "@/modules/orders/admin-queries";
import type { MenuItem } from "@/types/menu";
import { OrderCard } from "./OrderCard";
import { ToBuyList } from "./ToBuyList";
import {
  buildShoppingList,
  groupOrdersByPerson,
} from "./live-orders-view";

type StatusFilter = "all" | "pending" | "approved";

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
];

type LiveOrdersProps = {
  orders: LiveOrder[];
  windowId: string;
  windowLabel: string;
  menuItems: MenuItem[];
};

export function LiveOrders({
  orders,
  windowId,
  windowLabel,
  menuItems,
}: LiveOrdersProps) {
  const people = useMemo(() => groupOrdersByPerson(orders), [orders]);
  const shops = useMemo(() => buildShoppingList(orders), [orders]);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [showClosed, setShowClosed] = useState(false);
  const [approving, startApproving] = useTransition();

  if (orders.length === 0) {
    return (
      <div className='border border-dashed p-8 text-center text-sm text-muted-foreground'>
        No orders yet
      </div>
    );
  }

  // rejected and cancelled orders are out of the list and the totals
  const open = people.filter(
    (person) => person.status === "pending" || person.status === "approved",
  );
  const closed = people.filter(
    (person) => person.status === "rejected" || person.status === "cancelled",
  );
  const counts: Record<StatusFilter, number> = {
    all: open.length,
    pending: open.filter((person) => person.status === "pending").length,
    approved: open.filter((person) => person.status === "approved").length,
  };
  const pendingOrders = orders.filter((order) => order.status === "pending");

  const query = search.trim().toLowerCase();
  // pending first, then by name
  const visible = open
    .filter(
      (person) =>
        (filter === "all" || person.status === filter) &&
        (!query || person.user.name.toLowerCase().includes(query)),
    )
    .sort(
      (a, b) =>
        Number(b.status === "pending") - Number(a.status === "pending"),
    );

  function approveAll() {
    startApproving(async () => {
      const result = await approvePendingOrdersAction(windowId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(
        `Approved ${result.count} order${result.count === 1 ? "" : "s"}`,
      );
    });
  }

  return (
    // phones: To buy, filters, orders. Wide screens: filters across the top,
    // then orders and To buy side by side, starting on the same line.
    <div className='flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start lg:gap-x-4'>
      <ToBuyList
        shops={shops}
        windowLabel={windowLabel}
        className='lg:sticky lg:top-4 lg:col-start-2 lg:row-start-2'
      />

      <div className='flex flex-wrap items-center gap-2 lg:col-span-2 lg:row-start-1'>
        <div
          role='group'
          aria-label='Show orders'
          className='inline-flex h-8 divide-x border bg-card'
        >
          {FILTERS.map(({ value, label }) => {
            const selected = filter === value;
            return (
              <button
                key={value}
                type='button'
                aria-pressed={selected}
                onClick={() => setFilter(value)}
                className={cn(
                  "flex items-center gap-1.5 px-3 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                  selected
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {label}
                <span className='tabular-nums opacity-75'>{counts[value]}</span>
              </button>
            );
          })}
        </div>
        <label className='flex h-8 w-full items-center gap-2 border bg-card px-2.5 focus-within:border-ring sm:w-52'>
          <Search className='size-3.5 shrink-0 text-muted-foreground' />
          <input
            type='search'
            placeholder='Search a name'
            aria-label='Search a name'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground'
          />
        </label>
        {pendingOrders.length > 0 && (
          <Button
            variant='outline'
            size='sm'
            className='h-8 sm:ml-auto'
            onClick={approveAll}
            disabled={approving}
          >
            Approve all pending
          </Button>
        )}
      </div>

      <div className='min-w-0 space-y-2 lg:col-start-1 lg:row-start-2'>
        {visible.map((person) => (
          <OrderCard key={person.id} order={person} menuItems={menuItems} />
        ))}
        {visible.length === 0 && (
          <p className='border border-dashed p-6 text-center text-sm text-muted-foreground'>
            No orders match
          </p>
        )}

        {closed.length > 0 && (
          <div className='space-y-3'>
            <div className='flex items-center gap-3 border border-dashed px-4 py-2 text-sm text-muted-foreground'>
              <span>{closedSummary(closed.map((person) => person.status))}</span>
              <Button
                variant='ghost'
                size='sm'
                className='ml-auto'
                aria-expanded={showClosed}
                onClick={() => setShowClosed((value) => !value)}
              >
                {showClosed ? "Hide" : "Show"}
              </Button>
            </div>
            {showClosed &&
              closed.map((person) => (
                <OrderCard
                  key={person.id}
                  order={person}
                  menuItems={menuItems}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

// "1 rejected order", "2 cancelled orders", "1 rejected and 1 cancelled order"
function closedSummary(statuses: string[]) {
  const rejected = statuses.filter((status) => status === "rejected").length;
  const cancelled = statuses.length - rejected;
  const parts = [
    rejected > 0 && `${rejected} rejected`,
    cancelled > 0 && `${cancelled} cancelled`,
  ].filter(Boolean);
  return `${parts.join(" and ")} order${statuses.length === 1 ? "" : "s"}`;
}
