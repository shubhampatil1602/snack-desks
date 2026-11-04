"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cart-store";

// The saved cart belongs to the window it was filled in. On any page, a cart
// from another window (closed while the tab was away, so the SSE was missed)
// is dropped, not just when no window is open. Read from the store itself:
// the first render sees the store's defaults, not what's saved.
export function CartSync({ activeWindowId }: { activeWindowId: string | null }) {
  useEffect(() => {
    const cart = useCartStore.getState();
    if (cart.windowId === activeWindowId) return;
    const hasCart = cart.items.length > 0 || cart.sharedItems.length > 0 || cart.hasPlacedOrder;
    if (hasCart) cart.clearCart();
    if (activeWindowId) cart.setWindowId(activeWindowId);
  }, [activeWindowId]);

  return null;
}
