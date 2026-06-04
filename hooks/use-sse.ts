"use client";

import { useEffect, useRef, useCallback } from "react";

type SSEHandler<T = unknown> = (payload: T) => void;

export interface WindowOpenedPayload {
  windowId: string;
  label: string;
  endsAt: string | null;
  startsAt: string;
}

export interface WindowClosedPayload {
  windowId: string;
}

export interface OrderPlacedPayload {
  orderId: string;
  userId: string;
  userName: string;
}

export interface OrderUpdatedPayload {
  orderId: string;
}

export interface OrderCancelledPayload {
  orderId: string;
}

export interface OrderStatusChangedPayload {
  orderId: string;
  status: string;
}

interface UseSSEOptions {
  onWindowOpened?: SSEHandler<WindowOpenedPayload>;
  onWindowClosed?: SSEHandler<WindowClosedPayload>;
  onOrderPlaced?: SSEHandler<OrderPlacedPayload>;
  onOrderUpdated?: SSEHandler<OrderUpdatedPayload>;
  onOrderCancelled?: SSEHandler<OrderCancelledPayload>;
  onOrderStatusChanged?: SSEHandler<OrderStatusChangedPayload>;
}

export function useSSE(options: UseSSEOptions) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const optionsRef = useRef(options);
  const connectRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    optionsRef.current = options;
  });

  const connect = useCallback(() => {
    eventSourceRef.current?.close();

    const es = new EventSource("/api/stream");
    eventSourceRef.current = es;

    es.addEventListener("connected", () => {
      console.log("[SSE] Connected to snackdesk stream");
    });

    es.addEventListener("heartbeat", () => {
      // silent - just keeps connection alive
    });

    es.addEventListener("window_opened", (e) => {
      optionsRef.current.onWindowOpened?.(JSON.parse(e.data));
    });

    es.addEventListener("window_closed", (e) => {
      optionsRef.current.onWindowClosed?.(JSON.parse(e.data));
    });

    es.addEventListener("order_placed", (e) => {
      optionsRef.current.onOrderPlaced?.(JSON.parse(e.data));
    });

    es.addEventListener("order_updated", (e) => {
      optionsRef.current.onOrderUpdated?.(JSON.parse(e.data));
    });

    es.addEventListener("order_cancelled", (e) => {
      optionsRef.current.onOrderCancelled?.(JSON.parse(e.data));
    });

    es.addEventListener("order_status_changed", (e) => {
      optionsRef.current.onOrderStatusChanged?.(JSON.parse(e.data));
    });

    es.onerror = () => {
      console.log("[SSE] Connection lost, reconnecting in 3s...");
      es.close();
      setTimeout(() => {
        connectRef.current?.();
      }, 3000);
    };
  }, []);

  useEffect(() => {
    connectRef.current = connect;
  });

  useEffect(() => {
    connect();
    return () => {
      eventSourceRef.current?.close();
    };
  }, [connect]);
}
