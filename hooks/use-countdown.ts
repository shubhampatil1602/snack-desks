import { useEffect, useState } from "react";

export function useCountdown(endsAt: Date | null) {
  const [remaining, setRemaining] = useState<number | null>(() => {
    if (!endsAt) return null;
    return Math.max(0, endsAt.getTime() - Date.now());
  });

  useEffect(() => {
    if (!endsAt) return;

    const interval = setInterval(() => {
      const diff = Math.max(0, endsAt.getTime() - Date.now());
      setRemaining(diff);
      if (diff === 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [endsAt]);

  return remaining;
}

export function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// determine urgency color
export const urgencyClass = (remaining: number | null) =>
  remaining === null
    ? "text-foreground"
    : remaining < 60000
      ? "text-destructive" // under 1 min — red
      : remaining < 300000
        ? "text-yellow-600" // under 5 min — yellow
        : "text-foreground"; // normal
