"use client";

import { useEffect, useState } from "react";

type Props = {
  endsAt: string | Date | null;
  serverNow: number;
};

export function CountdownTimer({ endsAt, serverNow }: Props) {
  const [timeLeft, setTimeLeft] = useState("--:--");

  useEffect(() => {
    if (!endsAt) return;

    const serverOffset = serverNow - Date.now();

    const update = () => {
      const diff = new Date(endsAt).getTime() - (Date.now() + serverOffset);

      if (diff <= 0) {
        setTimeLeft("Closed");
        return;
      }

      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);

      setTimeLeft(`${mins}:${secs.toString().padStart(2, "0")}`);
    };

    update();

    const interval = setInterval(update, 1000);

    return () => clearInterval(interval);
  }, [endsAt, serverNow]);

  return (
    <>
      {endsAt !== null ? (
        <div>
          <p className='text-3xl font-mono font-semibold'>{timeLeft}</p>
          <p className='text-xs text-muted-foreground mt-0.5'>remaining</p>
        </div>
      ) : (
        <div className='flex items-center gap-2 bg-yellow-50 border border-yellow-200 px-3 py-2 text-sm text-yellow-700 dark:bg-yellow-950 dark:border-yellow-900 dark:text-yellow-300'>
          <span>
            ⚠️ No timer set - this window will stay open until admin close it
            manually.
          </span>
        </div>
      )}
    </>
  );
}
