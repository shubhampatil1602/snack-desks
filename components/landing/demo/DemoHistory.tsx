"use client";

import { useState } from "react";
import { CalendarDays, ChevronDown, ChevronRight, Search, Sparkles, Trophy } from "lucide-react";

import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { bill, BILL_TOTAL, olderWindows, SAMPLE_PERIOD } from "./sample-data";
import { SPIN_SECTION_ID, useDemoOffice } from "./use-demo-office";

export const PAID_BADGE =
  "rounded-full border border-emerald-600 bg-linear-to-r from-emerald-400 via-green-500 to-emerald-500 px-2 py-0.5 text-white shadow-md dark:border-emerald-500 dark:from-emerald-600 dark:via-emerald-600 dark:to-emerald-700";
export const UNPAID_BADGE =
  "rounded-full border border-red-600 bg-linear-to-r from-red-400 via-orange-500 to-red-500 px-2 py-0.5 text-white shadow-md dark:border-red-500 dark:from-red-600 dark:via-red-600 dark:to-red-700";

function WhenAndWhat({ date, time, label }: { date: string; time: string; label: string }) {
  return (
    <>
      <span className='flex flex-col text-left'>
        <span className='text-sm font-medium'>{date}</span>
        <Badge className='text-left text-[10px] text-muted-foreground'>{time}</Badge>
      </span>
      <span className='text-xs text-muted-foreground'>·</span>
      <span className='line-clamp-1 text-sm font-medium'>{label}</span>
      <span className='text-xs text-muted-foreground'>·</span>
    </>
  );
}

// The admin's history with one closed window to spin, in sample data
export function DemoHistory() {
  const [expanded, setExpanded] = useState(true);
  const { winner, paid, pending, markPaid } = useDemoOffice();

  return (
    <div className='space-y-3 px-4 py-5'>
      <div>
        <p className='font-heading text-2xl'>Order History</p>
        <p className='text-sm text-muted-foreground'>
          Every window, who ordered and who paid. Spin the wheel to try it.
        </p>
      </div>

      <div inert className='flex flex-wrap items-center gap-2'>
        <div className='relative flex h-10 w-56 items-center border pl-8 text-sm text-muted-foreground'>
          <Search className='absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2' />
          Search employee...
        </div>
        <div className='flex h-10 shrink-0 items-center border bg-muted/10 px-3 text-sm'>
          <CalendarDays className='mr-2 h-4 w-4 text-muted-foreground' />
          <span className='mr-1.5 text-muted-foreground'>{SAMPLE_PERIOD}:</span>
          <span className='font-semibold'>{formatCurrency(24600)}</span>
        </div>
      </div>

      <section className='border bg-card'>
        <div className='flex flex-wrap items-center justify-between gap-3 p-3'>
          <button
            type='button'
            className='flex min-w-0 cursor-pointer items-center gap-2'
            aria-expanded={expanded}
            onClick={() => setExpanded((current) => !current)}
          >
            {expanded ? <ChevronDown className='h-3.5 w-3.5' /> : <ChevronRight className='h-3.5 w-3.5' />}
            <WhenAndWhat date='7 Nov 2026' time='4:30 pm' label='Evening Snacks' />
            <Badge className={paid ? PAID_BADGE : UNPAID_BADGE}>{paid ? "Paid" : "Unpaid"}</Badge>
          </button>

          <div className='flex flex-wrap items-center justify-end gap-2'>
            {winner && !paid && (
              <Button type='button' size='sm' onClick={markPaid}>
                Mark as Paid
              </Button>
            )}
            <Button size='sm' variant={winner ? "winner" : "default"} asChild>
              <a href={`#${SPIN_SECTION_ID}`}>
                {winner ? <Trophy className='mr-2 size-4' /> : <Sparkles className='mr-2 size-4' />}
                {winner ?? "Spin Wheel"}
              </a>
            </Button>
          </div>
        </div>

        {expanded && (
          <div className='overflow-x-auto border-t'>
            <Table>
              <TableHeader>
                <TableRow className='bg-muted/10 hover:bg-transparent'>
                  <TableHead className='py-2 text-xs font-medium'>User</TableHead>
                  <TableHead className='py-2 text-xs font-medium'>Items</TableHead>
                  <TableHead className='py-2 text-center text-xs font-medium'>
                    {formatCurrency(BILL_TOTAL)}
                    <span className='mx-1.5 text-xs text-muted-foreground'>·</span>
                    <span className='font-normal text-muted-foreground'>{bill.length} orders</span>
                  </TableHead>
                  <TableHead className='py-2 text-xs font-medium'>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bill.map((row) => (
                  <TableRow key={row.name}>
                    <TableCell className='py-2 font-medium'>
                      <span className='flex items-center gap-1.5 whitespace-nowrap'>
                        {row.name}
                        {row.name === winner && (
                          <Trophy aria-label='Split master' className='size-3.5 text-yellow-500' />
                        )}
                      </span>
                    </TableCell>
                    <TableCell className='min-w-48 py-2 text-xs whitespace-normal text-muted-foreground'>
                      {row.items}
                    </TableCell>
                    <TableCell className='py-2 text-center tabular-nums'>{formatCurrency(row.amount)}</TableCell>
                    <TableCell className='py-2'>
                      <OrderStatusBadge status={pending.includes(row.name) ? "pending" : "approved"} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {olderWindows.map((window) => (
        <section key={window.id} className='flex flex-wrap items-center justify-between gap-3 border bg-card p-3'>
          <span className='flex min-w-0 items-center gap-2'>
            <ChevronRight className='h-3.5 w-3.5' />
            <WhenAndWhat date={window.date} time={window.time} label={window.label} />
            <Badge className={PAID_BADGE}>Paid</Badge>
          </span>
          <span className='flex items-center gap-1.5 text-xs text-muted-foreground'>
            <Trophy className='size-3.5 text-yellow-500' />
            {window.winner}
          </span>
        </section>
      ))}
    </div>
  );
}
