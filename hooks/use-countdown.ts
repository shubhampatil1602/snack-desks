import { useEffect, useState } from "react";

export function useCountdown(endsAt: Date | null, serverNow: number) {
  const [offset] = useState(() => serverNow - Date.now());

  const [remaining, setRemaining] = useState<number | null>(() => {
    if (!endsAt) return null;

    return Math.max(0, endsAt.getTime() - (Date.now() + offset));
  });

  useEffect(() => {
    if (!endsAt) return;

    const interval = setInterval(() => {
      const diff = Math.max(0, endsAt.getTime() - (Date.now() + offset));

      setRemaining(diff);

      if (diff === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endsAt, offset]);

  return remaining;
}

export function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function urgencyClass(ms: number) {
  const minutes = ms / 1000 / 60;

  if (minutes <= 1) {
    return "text-red-500 animate-pulse";
  }

  if (minutes <= 5) {
    return "text-orange-500";
  }

  return "text-green-600";
}
