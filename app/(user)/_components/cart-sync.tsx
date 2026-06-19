"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cart-store";

export function CartSync({ hasActiveWindow }: { hasActiveWindow: boolean }) {
  const clearCart = useCartStore((s) => s.clearCart);
  const items = useCartStore((s) => s.items);

  useEffect(() => {
    if (!hasActiveWindow && items.length > 0) {
      clearCart();
    }
  }, [hasActiveWindow, items.length, clearCart]);

  return null;
}
