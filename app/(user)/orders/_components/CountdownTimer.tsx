"use client";

import { useEffect, useState } from "react";

type Props = {
  endsAt: string | Date | null;
};

export function CountdownTimer({ endsAt }: Props) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!endsAt) return;

    const interval = setInterval(() => {
      const diff = new Date(endsAt).getTime() - Date.now();

      if (diff <= 0) {
        setTimeLeft("Closed");
        clearInterval(interval);
        return;
      }

      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);

      setTimeLeft(`${mins}:${secs.toString().padStart(2, "0")}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [endsAt]);

  // return <span>{timeLeft}</span>;
  return (
    <>
      {endsAt !== null ? (
        <div>
          <p className={`text-3xl font-mono font-semibold `}>{timeLeft}</p>
          <p className='text-xs text-muted-foreground mt-0.5'>remaining</p>
        </div>
      ) : (
        !endsAt && (
          <div className='flex items-center gap-2 bg-yellow-50 border border-yellow-200 px-3 py-2 text-sm text-yellow-700 dark:bg-yellow-950 dark:border-yellow-900 dark:text-yellow-300'>
            <span>
              ⚠️ No timer set - this window will stay open until admin close it
              manually.
            </span>
          </div>
        )
      )}
    </>
  );
}
