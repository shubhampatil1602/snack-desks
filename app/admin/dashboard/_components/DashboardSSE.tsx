"use client";

import { useSSEEvent } from "@/providers/sse-provider";
import { useRouter } from "next/navigation";

export function DashboardSSE() {
  const router = useRouter();
  const refresh = () => router.refresh();

  useSSEEvent("order_placed", refresh);
  useSSEEvent("order_updated", refresh);
  useSSEEvent("order_cancelled", refresh);
  useSSEEvent("order_status_changed", refresh);
  useSSEEvent("window_opened", refresh);
  useSSEEvent("window_closed", refresh);

  return null;
}
