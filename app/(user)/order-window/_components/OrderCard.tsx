"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import { placeOrderAction, updateOrderAction } from "@/actions/orders";
import { Button } from "@/components/ui/button";
import { hasCartChanged, toOrderItemsInput } from "@/lib/cart";
import { ORDER_STATUS } from "@/lib/constants";
import { cn, formatPrice } from "@/lib/utils";
import {
  useCartCount,
  useCartStore,
  useCartSubtotal,
} from "@/store/cart-store";
import { useCartSheetStore } from "@/store/cart-sheet-store";
import { useOrderMutation } from "@/store/order-mutation-store";
import { EmptyCartButton } from "@/app/(user)/_components/empty-cart-button";
import { ItemStepper } from "./ItemStepper";

// solid fill, so menu images don't show through
const ORDER_FILL =
  "bg-linear-to-br from-primary to-[color-mix(in_oklch,var(--primary),black_22%)] text-primary-foreground";
const ORDER_SHADOW =
  "shadow-[inset_0_1px_0_rgb(255_255_255/0.22),0_12px_30px_-8px_rgb(0_0_0/0.55)]";

// dark halo behind the pill and bar, so the order lifts off the menu
function Glow() {
  return (
    <span
      aria-hidden
      className='pointer-events-none absolute -inset-3 -z-10 bg-black/45 blur-xl transition-opacity group-hover:opacity-100 dark:bg-black/70 opacity-90'
    />
  );
}

function BagIcon({ count }: { count: number }) {
  return (
    <span className='relative grid h-9 w-9 shrink-0 place-items-center bg-black/15'>
      <ShoppingBag className='h-[18px] w-[18px]' />
      {count > 0 && (
        <span className='absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-background px-1 text-[11px] font-bold tabular-nums text-primary shadow-sm'>
          {count}
        </span>
      )}
    </span>
  );
}

// Wide screens: the order floats at the bottom right and folds into a pill,
// so the menu keeps its full width. Splits, replacements and cancelling stay
// in the cart sheet, which "Open cart" brings up.
export function OrderCard() {
  const router = useRouter();
  // folded by default, so it doesn't cover the menu
  const [open, setOpen] = useState(false);
  // stays mounted while the close animation plays
  const [closing, setClosing] = useState(false);
  // shared with the cart sheet, so a request from either one busies both
  const { pending, run } = useOrderMutation();
  const items = useCartStore((state) => state.items);
  const sharedItems = useCartStore((state) => state.sharedItems) ?? [];
  const savedItems = useCartStore((state) => state.savedItems);
  const windowId = useCartStore((state) => state.windowId);
  const orderId = useCartStore((state) => state.orderId);
  const hasPlacedOrder = useCartStore((state) => state.hasPlacedOrder);
  const orderStatus = useCartStore((state) => state.orderStatus);
  const setCartOpen = useCartSheetStore((state) => state.setOpen);
  const count = useCartCount();
  const subtotal = useCartSubtotal();

  const canEdit = !hasPlacedOrder || orderStatus === ORDER_STATUS.PENDING;
  const hasChanges = hasCartChanged(items, savedItems);
  const countLabel = `${count} item${count === 1 ? "" : "s"}`;
  const summary = `${countLabel} · ${formatPrice(subtotal)}`;
  const title = hasPlacedOrder ? `Order ${orderStatus}` : "Your order";

  function submit() {
    run(hasPlacedOrder ? "updating" : "placing", async () => {
      const result = hasPlacedOrder
        ? orderId
          ? await updateOrderAction(orderId, toOrderItemsInput(items))
          : { success: false as const, error: "Order not found" }
        : windowId
          ? await placeOrderAction({ windowId, items: toOrderItemsInput(items) })
          : { success: false as const, error: "Order window not found" };

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(hasPlacedOrder ? "Order updated" : "Order placed");
      router.refresh();
    });
  }

  function hide() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOpen(false);
      return;
    }
    setClosing(true);
  }

  if (!open) {
    return (
      <button
        type='button'
        onClick={() => setOpen(true)}
        className='group fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-5 z-40 hidden origin-bottom-right transition-transform duration-200 animate-in fade-in-0 zoom-in-90 hover:-translate-y-0.5 motion-reduce:animate-none lg:block'
        aria-label={`Show your order, ${summary}`}
      >
        <Glow />
        <span
          className={cn(
            "flex items-center gap-3 py-2.5 pl-2.5 pr-4 text-left",
            ORDER_FILL,
            ORDER_SHADOW,
          )}
        >
          <BagIcon count={count} />
          <span className='leading-tight'>
            <span className='block text-[11px] font-semibold uppercase tracking-widest opacity-85'>
              {title}
            </span>
            <span className='block text-base font-bold tabular-nums'>
              {formatPrice(subtotal)}
            </span>
          </span>
          <ChevronUp className='ml-2 h-4 w-4 opacity-85' />
        </span>
      </button>
    );
  }

  return (
    <aside
      aria-label='Your order'
      onAnimationEnd={(event) => {
        if (closing && event.target === event.currentTarget) {
          setClosing(false);
          setOpen(false);
        }
      }}
      className={cn(
        "fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-5 z-40 hidden w-80 origin-bottom-right flex-col border bg-card shadow-[0_24px_60px_-12px_rgb(0_0_0/0.7)] motion-reduce:animate-none lg:flex",
        // grows out of the pill's corner, like shadcn popovers
        closing
          ? "animate-out fade-out-0 zoom-out-95 slide-out-to-bottom-2 fill-mode-forwards duration-150 ease-in"
          : "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-200 ease-out",
      )}
    >
      {/* same face as the folded pill, so opening it reads as one piece */}
      <div className={cn("flex items-center gap-3 py-2.5 pl-2.5 pr-4", ORDER_FILL)}>
        <BagIcon count={count} />
        <div className='min-w-0 flex-1 leading-tight'>
          <h2 className='text-[11px] font-semibold uppercase tracking-widest opacity-85'>
            {title}
          </h2>
          <p className='text-base font-bold tabular-nums'>{countLabel}</p>
        </div>
        <button
          type='button'
          onClick={hide}
          className='flex items-center gap-1 px-1 py-1 text-xs font-bold uppercase tracking-wider opacity-85 hover:opacity-100'
        >
          Hide
          <ChevronDown className='h-3.5 w-3.5' />
        </button>
      </div>

      <div className='max-h-[40vh] overflow-y-auto px-4'>
        {items.map((item) => {
          const lineTotal = Number(item.price) * item.quantity;
          const people = (item.splitUsers?.length ?? 0) + 1;
          return (
            <div
              key={item.menuItemId}
              className='flex items-center justify-between gap-3 border-b py-2.5 last:border-b-0'
            >
              <div className='min-w-0'>
                <p className='truncate text-sm font-semibold' title={item.name}>
                  {item.name}
                </p>
                <p className='truncate text-xs tabular-nums text-muted-foreground'>
                  {people > 1
                    ? `Split ${people} ways · you pay ${formatPrice(lineTotal / people)}`
                    : `${item.quantity} × ${formatPrice(item.price)} = ${formatPrice(lineTotal)}`}
                </p>
              </div>
              {canEdit ? (
                <ItemStepper
                  menuItemId={item.menuItemId}
                  name={item.name}
                  price={item.price}
                  isGroupOrderEnabled={item.isGroupOrderEnabled ?? false}
                  quantity={item.quantity}
                  className='w-20 shrink-0'
                />
              ) : (
                <span className='text-sm tabular-nums'>×{item.quantity}</span>
              )}
            </div>
          );
        })}

        {sharedItems.length > 0 && (
          <div className='space-y-1 border-t py-2.5'>
            <p className='text-[11px] font-bold uppercase tracking-wider text-primary'>
              Shared with you
            </p>
            {sharedItems.map((item) => (
              <div key={item.id} className='flex justify-between gap-2 text-sm'>
                <span className='truncate'>
                  {item.quantity}× {item.name}
                </span>
                <span className='shrink-0 tabular-nums text-muted-foreground'>
                  {formatPrice(item.userShare)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className='space-y-2.5 border-t px-4 py-3'>
        <div className='flex items-baseline justify-between'>
          <span className='text-xs font-bold uppercase tracking-widest text-muted-foreground'>
            Total
          </span>
          <span className='text-xl font-bold tabular-nums'>
            {formatPrice(subtotal)}
          </span>
        </div>

        {/* stacked: side by side, the wide-tracked labels overflow the card */}
        {!hasPlacedOrder ? (
          <Button
            size='lg'
            className='w-full'
            onClick={submit}
            disabled={items.length === 0 || pending !== null}
          >
            {pending === "placing" && <Loader2 className='animate-spin' />}
            {pending === "placing" ? "Placing..." : "Place order"}
          </Button>
        ) : orderStatus === ORDER_STATUS.PENDING ? (
          <Button
            size='lg'
            className='w-full'
            onClick={submit}
            disabled={!hasChanges || items.length === 0 || pending !== null}
          >
            {pending === "updating" && <Loader2 className='animate-spin' />}
            {pending === "updating" ? "Updating..." : "Update order"}
          </Button>
        ) : null}
        <div className='flex gap-2'>
          <Button
            variant='outline'
            className='flex-1 px-2'
            onClick={() => setCartOpen(true)}
          >
            Open cart
            <ArrowRight />
          </Button>
          <EmptyCartButton className='flex-1 px-2' />
        </div>

        <p className='text-xs text-muted-foreground'>
          {!hasPlacedOrder
            ? "Open the cart to split items or pick replacements."
            : orderStatus === ORDER_STATUS.PENDING
              ? "Pending approval. You can change or cancel it until then."
              : `This order is ${orderStatus}.`}
        </p>
      </div>
    </aside>
  );
}

// Phones and tablets: a bar pinned to the bottom of the menu that opens the cart
export function CartBar() {
  const items = useCartStore((state) => state.items);
  const setCartOpen = useCartSheetStore((state) => state.setOpen);
  const count = useCartCount();
  const subtotal = useCartSubtotal();

  if (count === 0) return null;

  const names = items.map((item) => item.name);

  return (
    <button
      type='button'
      onClick={() => setCartOpen(true)}
      className='group sticky bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 block w-full isolate lg:hidden'
    >
      <Glow />
      <span
        className={cn(
          "flex items-center gap-3 py-2.5 pl-2.5 pr-3 text-left",
          ORDER_FILL,
          ORDER_SHADOW,
        )}
      >
        <BagIcon count={count} />
        <span className='min-w-0 flex-1 leading-tight'>
          <span className='block font-bold tabular-nums'>
            {formatPrice(subtotal)}
          </span>
          {names.length > 0 && (
            <span className='block truncate text-xs opacity-85'>
              {names.slice(0, 3).join(", ")}
              {names.length > 3 && " and more"}
            </span>
          )}
        </span>
        <span className='flex shrink-0 items-center gap-1.5 bg-black/15 px-3 py-1.5 text-xs font-bold uppercase tracking-widest'>
          View order
          <ArrowRight className='h-3.5 w-3.5' />
        </span>
      </span>
    </button>
  );
}
