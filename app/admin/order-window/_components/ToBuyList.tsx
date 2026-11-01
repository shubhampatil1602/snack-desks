"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ChevronDown, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency, formatPrice } from "@/lib/utils";
import type { ShoppingShop } from "./live-orders-view";

// Everything to buy for the window, per shop. Folded on phones, where it
// sits above the orders.
export function ToBuyList({
  shops,
  windowLabel,
  className,
}: {
  shops: ShoppingShop[];
  windowLabel: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  if (shops.length === 0) return null;

  const lines = shops.flatMap((shop) => shop.lines);
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const total = shops.reduce((sum, shop) => sum + shop.amount, 0);

  function toggleWho(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function copyList() {
    const text = [
      windowLabel,
      ...shops.flatMap((shop) => [
        "",
        shop.name,
        ...shop.lines.map((line) => `${line.quantity}× ${line.name}`),
      ]),
      "",
      `Total ${formatCurrency(total)}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      toast.success("List copied");
    } catch {
      toast.error("Couldn't copy the list");
    }
  }

  return (
    <aside aria-label='To buy' className={cn("border bg-card", className)}>
      <button
        type='button'
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className='flex w-full items-baseline justify-between gap-2 px-4 pb-1 pt-3 text-left lg:pointer-events-none'
      >
        <h2 className='font-heading text-xl'>To buy</h2>
        <span className='flex items-center gap-2 text-xs text-muted-foreground tabular-nums'>
          {itemCount} items
          <span className='lg:hidden'>· {formatCurrency(total)}</span>
          <ChevronDown
            className={cn(
              "size-4 self-center transition-transform lg:hidden",
              open && "rotate-180",
            )}
          />
        </span>
      </button>

      <div className={cn(!open && "hidden", "lg:block")}>
        <p className='px-4 text-xs text-muted-foreground'>
          Tap an item to see who ordered it.
        </p>

        {shops.map((shop) => (
          <section key={shop.name} aria-label={shop.name}>
            <h3 className='flex justify-between px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-widest text-primary'>
              <span>{shop.name}</span>
              <span className='text-muted-foreground tabular-nums'>
                {formatPrice(shop.amount)}
              </span>
            </h3>
            <ul className='px-4 text-sm tabular-nums'>
              {shop.lines.map((line) => {
                const key = `${shop.name}:${line.menuItemId}`;
                const showWho = expanded.has(key);
                return (
                  <li
                    key={line.menuItemId}
                    className='border-b border-dashed last:border-b-0'
                  >
                    <button
                      type='button'
                      aria-expanded={showWho}
                      onClick={() => toggleWho(key)}
                      className='group grid w-full grid-cols-[2.25rem_minmax(0,1fr)_auto] items-baseline gap-x-2 py-1.5 text-left'
                    >
                      <span className='font-semibold'>{line.quantity}×</span>
                      <span className='min-w-0 decoration-muted-foreground/40 underline-offset-2 group-hover:underline'>
                        {line.name}
                        {line.sharedBy > 0 && (
                          <span className='block text-[11px] text-violet-600 dark:text-violet-400'>
                            shared by {line.sharedBy}
                          </span>
                        )}
                      </span>
                      <span className='text-muted-foreground'>
                        {formatPrice(line.amount)}
                      </span>
                    </button>
                    {showWho && (
                      <p className='pb-2 pl-[2.75rem] text-xs text-muted-foreground'>
                        {line.who.join(" · ")}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        <div className='mt-2 space-y-3 border-t px-4 py-3'>
          <div className='flex justify-between font-semibold tabular-nums'>
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
          <Button className='w-full' onClick={copyList}>
            <Copy />
            Copy list
          </Button>
        </div>
      </div>
    </aside>
  );
}
