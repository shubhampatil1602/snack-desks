"use client";

import { useEffect, useState } from "react";

type ResetTokenCountdownProps = {
  expiresAt: Date | string;
};

export function ResetTokenCountdown({ expiresAt }: ResetTokenCountdownProps) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt).getTime() - new Date().getTime();

      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }

      const minutes = Math.floor(diff / 1000 / 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft(`${minutes}m ${seconds.toString().padStart(2, "0")}s`);
    };

    update();

    const interval = setInterval(update, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  return <span className='text-sm font-medium text-amber-600'>{timeLeft}</span>;
}
