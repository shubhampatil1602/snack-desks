"use client";

import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn, formatCurrency, formatPrice } from "@/lib/utils";
import { DemoWindowCard } from "./DemoWindowCard";
import { bill, BILL_TOTAL, toBuy } from "./sample-data";
import { useDemoOffice } from "./use-demo-office";

// The admin's live orders: approve what's waiting, and see what to buy from
// each shop. Only this page's memory changes.
export function DemoAdminOrders() {
  const { pending, approve } = useDemoOffice();
  const orders = [
    ...bill.filter((row) => pending.includes(row.name)),
    ...bill.filter((row) => !pending.includes(row.name)),
  ];

  return (
    <div className='space-y-3 px-4 py-5'>
      <div>
        <p className='font-heading text-2xl tracking-wide'>Orders</p>
        <p className='mt-1 text-sm text-muted-foreground'>Manage order windows and live orders</p>
      </div>

      <DemoWindowCard />

      <div className='grid items-start gap-3 @4xl/app:grid-cols-[minmax(0,1fr)_17rem]'>
        <div className='space-y-3'>
          {orders.map((row) => {
            const isPending = pending.includes(row.name);
            return (
              <article key={row.name} className={cn("border bg-card", isPending && "border-l-[3px] border-l-amber-500")}>
                <header className='flex flex-wrap items-center gap-x-3 gap-y-2 border-b bg-muted/40 px-4 py-2'>
                  <h3 className='font-medium'>{row.name}</h3>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-1.5 py-0.5 text-[10px] font-semibold tracking-widest uppercase",
                      isPending ? "text-amber-700 dark:text-amber-300" : "text-green-700 dark:text-green-400",
                    )}
                  >
                    <span aria-hidden className='size-1.5 rounded-full bg-current' />
                    {isPending ? "pending" : "approved"}
                  </span>
                  <span className='ml-auto font-semibold tabular-nums'>{formatCurrency(row.amount)}</span>
                  {isPending && (
                    <Button type='button' size='sm' onClick={() => approve(row.name)}>
                      <Check className='mr-1 size-4' />
                      Approve
                    </Button>
                  )}
                </header>
                <p className='px-4 py-2 text-sm text-muted-foreground'>{row.items}</p>
              </article>
            );
          })}
        </div>

        <aside aria-label='To buy' className='border bg-card'>
          <div className='flex items-baseline justify-between gap-2 px-4 pt-3 pb-1'>
            <h3 className='font-heading text-xl'>To buy</h3>
            <span className='text-xs text-muted-foreground tabular-nums'>
              {toBuy.reduce((sum, shop) => sum + shop.lines.reduce((count, line) => count + line.quantity, 0), 0)} items
            </span>
          </div>
          {toBuy.map((shop) => (
            <section key={shop.name} aria-label={shop.name}>
              <h4 className='flex justify-between px-4 pt-3 pb-1 text-[11px] font-semibold tracking-widest text-primary uppercase'>
                <span>{shop.name}</span>
                <span className='text-muted-foreground tabular-nums'>
                  {formatPrice(shop.lines.reduce((sum, line) => sum + line.amount, 0))}
                </span>
              </h4>
              <ul className='px-4 text-sm tabular-nums'>
                {shop.lines.map((line) => (
                  <li
                    key={line.name}
                    className='grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-baseline gap-x-2 border-b border-dashed py-1.5 last:border-b-0'
                  >
                    <span className='font-semibold'>{line.quantity}×</span>
                    <span className='min-w-0'>{line.name}</span>
                    <span className='text-muted-foreground'>{formatPrice(line.amount)}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <div className='mt-2 flex justify-between border-t px-4 py-3 font-semibold tabular-nums'>
            <span>Total</span>
            <span>{formatCurrency(BILL_TOTAL)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
