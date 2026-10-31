"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import { QuantityInput } from "@/app/(user)/_components/QuantityInput";

type Props = {
  menuItemId: string;
  name: string;
  price: string;
  isGroupOrderEnabled: boolean;
  quantity: number;
  className?: string;
};

// ADD button that turns into a − qty + stepper once the item is in the cart
export function ItemStepper({
  menuItemId,
  name,
  price,
  isGroupOrderEnabled,
  quantity,
  className,
}: Props) {
  const addItem = useCartStore((state) => state.addItem);
  const increment = useCartStore((state) => state.increment);
  const decrement = useCartStore((state) => state.decrement);
  const setQuantity = useCartStore((state) => state.setQuantity);

  if (quantity === 0) {
    return (
      <Button
        className={cn("h-8 w-24", className)}
        onClick={() => addItem({ menuItemId, name, price, isGroupOrderEnabled })}
        aria-label={`Add ${name}`}
      >
        Add
      </Button>
    );
  }

  return (
    <div
      className={cn(
        // same fill as the ADD button it replaces
        "grid h-8 w-24 grid-cols-3 items-center bg-primary text-primary-foreground",
        className,
      )}
    >
      <button
        type='button'
        className='flex h-full items-center justify-center hover:bg-black/15'
        onClick={() => decrement(menuItemId)}
        aria-label={`One less ${name}`}
      >
        <Minus className='h-3.5 w-3.5' />
      </button>
      <div className='flex h-full items-center justify-center font-semibold'>
        <QuantityInput
          initialQuantity={quantity}
          onUpdate={(qty) => setQuantity(menuItemId, qty)}
        />
      </div>
      <button
        type='button'
        className='flex h-full items-center justify-center hover:bg-black/15'
        onClick={() => increment(menuItemId)}
        aria-label={`One more ${name}`}
      >
        <Plus className='h-3.5 w-3.5' />
      </button>
    </div>
  );
}
