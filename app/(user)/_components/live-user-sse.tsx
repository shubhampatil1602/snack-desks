"use client";

import { useRouter } from "next/navigation";
import { useSSE } from "@/hooks/use-sse";
import { useCartStore } from "@/store/cart-store";

export function LiveUserSSE() {
  const router = useRouter();

  const clearCart = useCartStore((state) => state.clearCart);

  useSSE({
    onWindowClosed: () => {
      clearCart();
      router.refresh();
    },
  });

  return null;
}
