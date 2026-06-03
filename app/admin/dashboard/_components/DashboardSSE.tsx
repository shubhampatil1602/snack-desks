"use client";

import { useRouter } from "next/navigation";
import { useSSE } from "@/hooks/use-sse";

export function DashboardSSE() {
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

    onOrderStatusChanged: () => {
      router.refresh();
    },

    onWindowOpened: () => {
      router.refresh();
    },

    onWindowClosed: () => {
      router.refresh();
    },
  });

  return null;
}
