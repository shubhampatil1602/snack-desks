import { useSyncExternalStore } from "react";

const startedAt = Date.now();

function subscribe(onTick: () => void) {
  const timer = setInterval(onTick, 1000);
  return () => clearInterval(timer);
}

// Milliseconds left on the demo's order window. Every screen reads the same
// clock, which starts over when it runs out; nothing here touches a real window.
export function useDemoCountdown(seconds: number) {
  const left = useSyncExternalStore(
    subscribe,
    () => seconds - (Math.floor((Date.now() - startedAt) / 1000) % seconds),
    () => seconds,
  );
  return left * 1000;
}
