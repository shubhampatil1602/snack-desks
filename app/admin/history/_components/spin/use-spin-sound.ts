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
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

type Leg = { to: number; ms: number; ease: (t: number) => number };

/**
 * The stop, as legs in the spinner's own units (radians or rows): slow down
 * and stop just short of the winner, hold, go round once more, run a little
 * past the winner and swing back onto it.
 * `nearMiss` and `overshoot` are how far before and past `to` it turns back.
 */
export function teaseLegs(
  to: number,
  lap: number,
  nearMiss: number,
  overshoot: number,
): Leg[] {
  const decoy = to - lap - nearMiss;
  return [
    { to: decoy, ms: 4000, ease: easeOutQuart },
    { to: decoy, ms: 650, ease: (t) => t },
    { to: to + overshoot, ms: 2600, ease: easeInOutCubic },
    { to, ms: 800, ease: easeInOutCubic },
  ];
}

// where the legs have got to `elapsed` ms after leaving `from`
export function followLegs(from: number, legs: Leg[], elapsed: number) {
  let start = from;
  for (const leg of legs) {
    if (elapsed < leg.ms) {
      return { value: start + (leg.to - start) * leg.ease(elapsed / leg.ms), done: false };
    }
    elapsed -= leg.ms;
    start = leg.to;
  }
  return { value: start, done: true };
}
