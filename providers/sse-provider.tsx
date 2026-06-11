"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
} from "react";

type SSEHandler<T = unknown> = (payload: T) => void;

type SSEContextValue = {
  subscribe: (event: string, handler: SSEHandler) => () => void;
};

const SSEContext = createContext<SSEContextValue | null>(null);

export function SSEProvider({
  children,
  enabled = true,
}: {
  children: React.ReactNode;
  enabled?: boolean;
}) {
  const handlersRef = useRef<Map<string, Set<SSEHandler>>>(new Map());
  const esRef = useRef<EventSource | null>(null);
  const backoffRef = useRef(1000);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectRef = useRef<(() => void) | null>(null);

  const connect = useCallback(() => {
    esRef.current?.close();

    const es = new EventSource("/api/stream");
    esRef.current = es;

    es.addEventListener("connected", () => {
      backoffRef.current = 1000; // reset backoff on successful connection
    });

    es.addEventListener("heartbeat", () => {
      // silent keepalive
    });

    const EVENTS = [
      "window_opened",
      "window_closed",
      "order_placed",
      "order_updated",
      "order_cancelled",
      "order_status_changed",
    ];

    for (const event of EVENTS) {
      es.addEventListener(event, (e) => {
        const handlers = handlersRef.current.get(event);
        if (!handlers) return;
        const payload = JSON.parse((e as MessageEvent).data);
        handlers.forEach((fn) => fn(payload));
      });
    }

    es.onerror = () => {
      es.close();
      // exponential backoff: 1s -> 2s -> 4s -> 8s -> max 30s
      timerRef.current = setTimeout(
        () => connectRef.current?.(),
        backoffRef.current,
      );
      backoffRef.current = Math.min(backoffRef.current * 2, 30_000);
    };
  }, []);

  // keep connectRef in sync with latest connect
  useEffect(() => {
    connectRef.current = connect;
  });

  useEffect(() => {
    if (!enabled) return;

    connect();

    return () => {
      esRef.current?.close();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, connect]);

  const subscribe = useCallback((event: string, handler: SSEHandler) => {
    if (!handlersRef.current.has(event)) {
      handlersRef.current.set(event, new Set());
    }
    handlersRef.current.get(event)!.add(handler);

    return () => {
      handlersRef.current.get(event)?.delete(handler);
    };
  }, []);

  return (
    <SSEContext.Provider value={{ subscribe }}>{children}</SSEContext.Provider>
  );
}

export function useSSEEvent<T = unknown>(
  event: string,
  handler: SSEHandler<T>,
) {
  const ctx = useContext(SSEContext);
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    if (!ctx) return;
    return ctx.subscribe(event, (p) => handlerRef.current(p as T));
  }, [ctx, event]);
}
