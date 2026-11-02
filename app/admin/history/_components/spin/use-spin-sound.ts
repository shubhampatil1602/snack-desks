"use client";

import { useCallback, useRef, useState } from "react";

const MUTED_KEY = "snackdesk-spin-muted";

// A soft tick for each slice or name that passes. Plays only after the admin
// clicked, and the mute choice is remembered on this device.
export function useSpinSound() {
  // nothing on the page depends on it before the dialog opens, so reading
  // it on first render can't cause a hydration mismatch
  const [muted, setMuted] = useState(() => {
    try {
      return typeof window !== "undefined" && localStorage.getItem(MUTED_KEY) === "1";
    } catch {
      return false;
    }
  });
  const audioRef = useRef<AudioContext | null>(null);

  const toggleMuted = useCallback(() => {
    setMuted((value) => {
      try {
        localStorage.setItem(MUTED_KEY, value ? "0" : "1");
      } catch {}
      return !value;
    });
  }, []);

  const tick = useCallback(
    (pitch = 1) => {
      if (muted) return;
      try {
        audioRef.current ??= new AudioContext();
        const audio = audioRef.current;
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();
        oscillator.type = "triangle";
        oscillator.frequency.value = 1400 * pitch;
        gain.gain.setValueAtTime(0.06, audio.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.05);
        oscillator.connect(gain).connect(audio.destination);
        oscillator.start();
        oscillator.stop(audio.currentTime + 0.06);
      } catch {}
    },
    [muted],
  );

  return { muted, toggleMuted, tick };
}

export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// fast start, long gentle stop
export const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

// how long the slow-down onto the winner takes
export const SETTLE_MS = 4500;
