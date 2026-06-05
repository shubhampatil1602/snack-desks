"use client";

import { useRouter } from "next/navigation";
import { useSSE } from "@/hooks/use-sse";

export function LiveOrdersSSE() {
  const router = useRouter();

  useSSE({
    onOrderPlaced: () => {
      router.refresh();
    },

    onOrderUpdated: () => {
      router.refresh();
    },

    onOrderCancelled: () => {
      router.refresh();
    },
  });

  return null;
}
