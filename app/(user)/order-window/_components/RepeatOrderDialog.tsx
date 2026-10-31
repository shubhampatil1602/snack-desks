"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { placeOrderAction } from "@/actions/orders";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import { useOrderMutation } from "@/store/order-mutation-store";
import type { RepeatOrder } from "@/modules/orders/reorder";

type Props = {
  windowId: string;
  order: RepeatOrder | null;
};

export function RepeatOrderDialog({ windowId, order }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { pending: mutation, run } = useOrderMutation();
  const pending = mutation !== null;
  const hasPlacedOrder = useCartStore((state) => state.hasPlacedOrder);
  const cartCount = useCartStore((state) => state.items.length);

  // once an order is placed, it's edited from the menu and cart instead
  if (hasPlacedOrder || !order) return null;

  const total = order.items.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0,
  );

  function placeOrder() {
    run("placing", async () => {
      const result = await placeOrderAction({
        windowId,
        items: order!.items.map(({ menuItemId, quantity }) => ({
          menuItemId,
          quantity,
        })),
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setOpen(false);
      toast.success("Order placed. You can still edit it until it's approved.");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* sits in the filter row: icon only until there's room for the label */}
        <Button
          size='sm'
          className='w-9 shrink-0 px-0 lg:w-auto lg:px-4'
          aria-label='Repeat previous order'
          title='Repeat previous order'
        >
          <RotateCcw />
          <span className='hidden lg:inline'>Repeat previous order</span>
        </Button>
      </DialogTrigger>

      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Repeat previous order</DialogTitle>
          <DialogDescription>
            Places the same items in this window. You can still edit the order
            afterwards.
          </DialogDescription>
        </DialogHeader>

        <div className='border p-3'>
          <p className='text-xs text-muted-foreground'>
            <span className='capitalize'>{order.windowLabel}</span>
            {" · "}
            {formatInTimeZone(order.createdAt, "Asia/Kolkata", "d MMM")}
          </p>
          <ul className='mt-2 max-h-[40vh] space-y-0.5 overflow-y-auto text-sm'>
            {order.items.map((item) => (
              <li key={item.menuItemId} className='flex justify-between'>
                <span>
                  {item.quantity}× {item.name}
                </span>
                <span className='text-muted-foreground'>
                  {formatCurrency(Number(item.price) * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          {order.skippedShops.length > 0 && (
            <p className='mt-2 text-xs text-amber-600 dark:text-amber-500'>
              Skipped items from {order.skippedShops.join(", ")}: not part of
              this order window
            </p>
          )}
        </div>

        {cartCount > 0 && (
          <p className='text-xs text-muted-foreground'>
            The items in your cart will be replaced by this order.
          </p>
        )}

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button onClick={placeOrder} disabled={pending}>
            {pending ? "Placing..." : `Place order · ${formatCurrency(total)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
