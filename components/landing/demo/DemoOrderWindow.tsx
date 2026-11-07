"use client";

import { useState } from "react";
import { Minus, Plus, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { VegMark } from "@/components/veg-mark";
import { formatTime } from "@/hooks/use-countdown";
import { DEFAULT_WINDOW_TAGLINE } from "@/lib/constants";
import { cn, formatPrice } from "@/lib/utils";
import { DemoSnackyBox } from "./DemoSnackyBox";
import { menu, SAMPLE_WINDOW_SECONDS } from "./sample-data";
import { useDemoCountdown } from "./use-demo-countdown";

// The employee's order window, using a cart that lives only in this component.
// The real one keeps its cart in the shared store and places real orders.
export function DemoOrderWindow() {
  const remaining = useDemoCountdown(SAMPLE_WINDOW_SECONDS);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [favourites, setFavourites] = useState<string[]>(["samosa"]);

  const bump = (id: string, by: number) =>
    setCart((current) => ({ ...current, [id]: Math.max(0, (current[id] ?? 0) + by) }));
  const toggleFavourite = (id: string) =>
    setFavourites((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );

  const count = menu.reduce((sum, item) => sum + (cart[item.id] ?? 0), 0);
  const subtotal = menu.reduce((sum, item) => sum + (cart[item.id] ?? 0) * item.price, 0);

  return (
    <div className='flex min-h-full flex-col gap-3 px-4 py-5'>
      <div className='bg-card p-4 shadow'>
        <div className='mb-2 flex flex-wrap items-start justify-between gap-3'>
          <div>
            <p className='font-heading text-2xl leading-none tracking-wide text-foreground'>
              Active Order Window
            </p>
            <p className='mt-1 font-heading tracking-wider text-muted-foreground uppercase italic'>
              Evening Snacks
            </p>
          </div>
          <div className='text-right'>
            <p className='font-mono text-3xl font-semibold'>{formatTime(remaining)}</p>
            <p className='mt-0.5 text-xs text-muted-foreground'>remaining</p>
          </div>
        </div>
        <div className='bg-zinc-900 p-3 dark:border dark:border-zinc-700 dark:bg-zinc-900/90'>
          <p className='text-lg leading-relaxed text-zinc-100'>{DEFAULT_WINDOW_TAGLINE}</p>
        </div>
      </div>

      <DemoSnackyBox />

      <div className='mt-3 flex items-center gap-3'>
        <p className='font-heading text-2xl leading-none'>Snacks</p>
        <span className='border px-1.5 py-0.5 text-[11px] font-bold text-muted-foreground tabular-nums'>
          {menu.length} items
        </span>
        <span aria-hidden className='h-px flex-1 bg-border' />
      </div>

      <div className='grid grid-cols-2 gap-3 @lg/app:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]'>
        {menu.map((item) => {
          const quantity = cart[item.id] ?? 0;
          const isFavourite = favourites.includes(item.id);
          return (
            <div key={item.id} className='isolate flex min-w-0 flex-col border bg-card'>
              <div className='relative h-40 w-full overflow-hidden bg-muted'>
                <div className='pointer-events-none absolute inset-0 bg-linear-to-t from-black via-black/50 to-black/5' />
                <div className='pointer-events-none absolute inset-x-0 bottom-0 z-10 p-3'>
                  <p className='line-clamp-2 leading-tight font-semibold text-white'>{item.name}</p>
                </div>
                <button
                  type='button'
                  onClick={() => toggleFavourite(item.id)}
                  aria-label={isFavourite ? `Remove ${item.name} from favourites` : `Add ${item.name} to favourites`}
                  aria-pressed={isFavourite}
                  className='absolute top-1.5 left-1.5 z-20 rounded-full bg-black/45 p-1.5 text-white/90 hover:bg-black/65 hover:text-white'
                >
                  <Star className={cn("h-4 w-4", isFavourite && "fill-amber-400 text-amber-400")} />
                </button>
                <div className='pointer-events-none absolute top-1.5 right-1.5 z-20 flex max-w-[calc(100%-3rem)] flex-col items-end gap-1 text-[10px] font-bold tracking-wider uppercase'>
                  <div className='flex max-w-full items-center gap-1'>
                    <span className='flex h-6 min-w-0 items-center border bg-accent px-2 text-primary shadow-sm'>
                      <span className='truncate'>{item.shop}</span>
                    </span>
                    <VegMark isVeg={item.isVeg} className='h-6 w-6 border-2 shadow-sm' />
                  </div>
                  {item.group && (
                    <span className='bg-emerald-600 px-1.5 py-1 text-white shadow-sm'>Group Split</span>
                  )}
                </div>
              </div>

              <div className='flex items-center justify-between gap-2 border-t p-2.5'>
                <p className='text-sm font-bold tabular-nums'>{formatPrice(item.price)}</p>
                {quantity === 0 ? (
                  <Button type='button' className='h-8 w-20 px-0' onClick={() => bump(item.id, 1)} aria-label={`Add ${item.name}`}>
                    Add
                  </Button>
                ) : (
                  <div className='grid h-8 w-20 grid-cols-3 items-center bg-primary text-primary-foreground'>
                    <button type='button' className='flex h-full items-center justify-center hover:bg-black/15' onClick={() => bump(item.id, -1)} aria-label={`One less ${item.name}`}>
                      <Minus className='h-3.5 w-3.5' />
                    </button>
                    <span className='text-center text-sm font-semibold'>{quantity}</span>
                    <button type='button' className='flex h-full items-center justify-center hover:bg-black/15' onClick={() => bump(item.id, 1)} aria-label={`One more ${item.name}`}>
                      <Plus className='h-3.5 w-3.5' />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {count > 0 && (
        <div className='sticky bottom-3 z-30 mt-auto self-end bg-linear-to-br from-primary to-[color-mix(in_oklch,var(--primary),black_22%)] px-4 py-2.5 text-primary-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.22),0_12px_30px_-8px_rgb(0_0_0/0.55)]'>
          <p className='text-[11px] font-semibold tracking-widest uppercase opacity-85'>
            Your order · {count} {count === 1 ? "item" : "items"}
          </p>
          <p className='text-base font-bold tabular-nums'>{formatPrice(subtotal)}</p>
        </div>
      )}
    </div>
  );
}
