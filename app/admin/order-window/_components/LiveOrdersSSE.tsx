"use client";

import { useSSEEvent } from "@/providers/sse-provider";
import { useRouter } from "next/navigation";

export function LiveOrdersSSE() {
  const router = useRouter();
  const refresh = () => router.refresh();

  useSSEEvent("order_placed", refresh);
  useSSEEvent("order_updated", refresh);
  useSSEEvent("order_cancelled", refresh);

  return null;
}
