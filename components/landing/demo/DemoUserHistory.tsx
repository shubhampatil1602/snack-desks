"use client";

import { Trophy } from "lucide-react";

import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { PAID_BADGE, UNPAID_BADGE } from "./DemoHistory";
import { bill, SAMPLE_PERIOD, USER_NAME, userPastOrders } from "./sample-data";
import { useDemoOffice } from "./use-demo-office";

const myRow = bill.find((row) => row.name === USER_NAME)!;
const BILL_PAID_BADGE =
  "rounded-full border border-amber-600 bg-linear-to-r from-amber-400 via-yellow-500 to-amber-500 px-2 py-0.5 text-white shadow-md dark:border-amber-500 dark:from-amber-600 dark:via-yellow-600 dark:to-amber-700";

function WinnerChip({ name }: { name: string }) {
  return (
    <span className='inline-flex items-center gap-1 text-xs text-muted-foreground'>
      <Trophy className='size-3.5 text-yellow-500' />
      {name}
    </span>
  );
}

// The employee's history: only their own orders, and what they owe for each
export function DemoUserHistory() {
  const { winner, billPaid, paid, pending, markBillPaid } = useDemoOffice();
  const iWon = winner === USER_NAME;

  return (
    <div className='space-y-3 px-4 py-5'>
      <div>
        <p className='font-heading text-2xl'>Order History</p>
        <p className='text-sm text-muted-foreground'>Your orders, what you owe and who to pay.</p>
      </div>

      <div className='flex h-10 w-fit items-center border bg-muted/10 px-3 text-sm'>
        <span className='mr-1.5 text-muted-foreground'>Total Spend · {SAMPLE_PERIOD}:</span>
        <span className='font-semibold'>{formatCurrency(2910)}</span>
      </div>

      <ul className='divide-y border bg-card'>
        <li className='space-y-2 p-3'>
          <div className='flex flex-wrap items-center gap-x-3 gap-y-2'>
            <span className='text-sm font-medium'>7 Nov 2026</span>
            <span className='text-sm'>Evening Snacks</span>
            {winner && <WinnerChip name={winner} />}
            <span className='ml-auto font-semibold tabular-nums'>{formatCurrency(myRow.amount)}</span>
            <OrderStatusBadge status={pending.includes(USER_NAME) ? "pending" : "approved"} />
            {paid ? (
              <Badge className={PAID_BADGE}>Paid</Badge>
            ) : billPaid ? (
              <Badge className={BILL_PAID_BADGE}>Bill paid</Badge>
            ) : iWon ? (
              <Button type='button' size='sm' className='h-6 rounded-full px-2.5 text-xs' onClick={markBillPaid}>
                I paid the bill
              </Button>
            ) : (
              <Badge className={UNPAID_BADGE}>Unpaid</Badge>
            )}
          </div>
          <p className='text-xs text-muted-foreground'>{myRow.items}</p>
          <p className='text-xs font-medium'>
            {!winner
              ? "The admin spins the wheel when the window closes."
              : iWon
                ? "The wheel picked you. Pay the shop, then collect everyone's share."
                : `Pay ${winner.split(" ")[0]} ${formatCurrency(myRow.amount)}.`}
          </p>
        </li>

        {userPastOrders.map((order) => (
          <li key={order.id} className='flex flex-wrap items-center gap-x-3 gap-y-2 p-3'>
            <span className='text-sm font-medium'>{order.date}</span>
            <span className='text-sm'>{order.label}</span>
            <WinnerChip name={order.winner} />
            <span className='ml-auto font-semibold tabular-nums'>{formatCurrency(order.total)}</span>
            <OrderStatusBadge status='approved' />
            <Badge className={PAID_BADGE}>Paid</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
