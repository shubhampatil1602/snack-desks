"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  easeOutQuart,
  prefersReducedMotion,
  SETTLE_MS,
} from "./use-spin-sound";

type ReelSpinnerProps = {
  names: string[];
  // index into names once the server has picked; null while waiting
  target: number | null;
  onTick: () => void;
  onSettled: () => void;
};

const ROW = 52;
// rows shown above and below the middle one
const SPREAD = 2;

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Names roll past a window like a slot machine from the moment it mounts;
 * once `target` arrives the reel slows down and stops on that name.
 */
export function ReelSpinner({
  names,
  target,
  onTick,
  onSettled,
}: ReelSpinnerProps) {
  // position in rows; the name at round(position) sits in the middle
  const [position, setPosition] = useState(0);
  const [blur, setBlur] = useState(0);
  const [landed, setLanded] = useState(false);
  // the animation loop reads the newest props without restarting
  const latest = useRef({ names, target, onTick, onSettled });
  useLayoutEffect(() => {
    latest.current = { names, target, onTick, onSettled };
  });

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    let speed = 0;
    let pos = 0;
    let lastRow = 0;
    let settle: { from: number; to: number; at: number } | null = null;

    const show = (value: number, velocity: number) => {
      pos = value;
      setPosition(value);
      setBlur(velocity > 0.3 ? Math.min(3, velocity * 6) : 0);
      const row = Math.round(value);
      if (row !== lastRow) {
        lastRow = row;
        latest.current.onTick();
      }
    };

    const finish = (index: number, from: number) => {
      const n = latest.current.names.length;
      setPosition(Math.ceil(from / n) * n + index);
      setBlur(0);
      setLanded(true);
      latest.current.onSettled();
    };

    const loop = (now: number) => {
      const { target: index, names: list } = latest.current;
      const n = Math.max(list.length, 1);

      if (settle) {
        const p = Math.min(1, (now - settle.at) / SETTLE_MS);
        const next = settle.from + (settle.to - settle.from) * easeOutQuart(p);
        show(next, next - pos);
        if (p < 1) frame = requestAnimationFrame(loop);
        else {
          setBlur(0);
          setLanded(true);
          latest.current.onSettled();
        }
        return;
      }

      if (index !== null && prefersReducedMotion()) return finish(index, pos);

      const dt = (now - last) / 1000;
      last = now;
      speed = Math.min(22, speed + dt * 45);
      show(pos + speed * dt, speed * dt);

      if (index !== null) {
        // stop on the winner after at least three more rounds of names
        let to = Math.ceil(pos / n) * n + index;
        while (to < pos + n * 3) to += n;
        settle = { from: pos, to, at: now };
      }
      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  const n = Math.max(names.length, 1);
  const base = Math.round(position);
  const offset = position - base;
  const rows = [];
  for (let k = -SPREAD - 1; k <= SPREAD + 1; k++) {
    const index = (((base + k) % n) + n) % n;
    rows.push({ k, name: names[index] ?? "" });
  }

  return (
    <div
      className='relative mx-auto w-full max-w-72 overflow-hidden border bg-background'
      style={{ height: ROW * (SPREAD * 2 + 1) }}
    >
      <div style={{ filter: blur ? `blur(${blur}px)` : undefined }}>
        {rows.map(({ k, name }) => (
          <div
            key={k}
            className={cn(
              "absolute inset-x-0 flex items-center gap-3 px-4 text-base whitespace-nowrap",
              landed && k === 0 && "font-semibold text-primary",
            )}
            style={{ height: ROW, top: (SPREAD + k - offset) * ROW }}
          >
            <span
              className={cn(
                "grid size-8 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-bold",
                landed && k === 0 && "bg-primary text-primary-foreground",
              )}
            >
              {initials(name)}
            </span>
            <span className='truncate'>{name}</span>
          </div>
        ))}
      </div>
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 bg-linear-to-b from-background via-transparent to-background'
      />
      <div
        aria-hidden
        className='pointer-events-none absolute inset-x-0 border-y-2 border-primary'
        style={{ top: ROW * SPREAD, height: ROW }}
      />
    </div>
  );
}
