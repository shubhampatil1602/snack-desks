"use client";

import { useSSEEvent } from "@/providers/sse-provider";
import { useCartStore } from "@/store/cart-store";
import { useRouter } from "next/navigation";

export function LiveUserSSE() {
  const router = useRouter();
  const clearCart = useCartStore((state) => state.clearCart);

  useSSEEvent("window_opened", () => router.refresh());
  useSSEEvent("window_closed", () => {
    clearCart();
    router.refresh();
  });

  return null;
}
