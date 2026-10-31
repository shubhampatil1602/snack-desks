"use client";

import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";

// Only before the order is placed: after that, cancelling the order does this.
// No confirm dialog; the toast offers an undo instead.
export function EmptyCartButton({ className }: { className?: string }) {
  const items = useCartStore((state) => state.items);
  const hasPlacedOrder = useCartStore((state) => state.hasPlacedOrder);
  const setItems = useCartStore((state) => state.setItems);

  if (hasPlacedOrder || items.length === 0) return null;

  function emptyCart() {
    const previous = items;
    setItems([]);
    toast("Cart emptied", {
      action: { label: "Undo", onClick: () => setItems(previous) },
    });
  }

  return (
    <Button variant='outline' className={className} onClick={emptyCart}>
      <Trash2 />
      Empty cart
    </Button>
  );
}
