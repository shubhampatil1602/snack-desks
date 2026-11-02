"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import {
  easeOutQuart,
  prefersReducedMotion,
  SETTLE_MS,
} from "./use-spin-sound";

type WheelSpinnerProps = {
  names: string[];
  // index into names once the server has picked; null while waiting
  target: number | null;
  onTick: () => void;
  onSettled: () => void;
};

const SIZE = 280;
const TAU = Math.PI * 2;
// brand orange, a warm sand and two greys, taken in turn
const SLICE_COLORS = ["var(--primary)", "#5b5650", "#e2a76f", "#3f3b37"];
const DARK_TEXT_SLICE = 2;

function resolveColor(color: string, el: HTMLElement) {
  if (!color.startsWith("var(")) return color;
  return getComputedStyle(el).getPropertyValue(color.slice(4, -1)).trim();
}

/**
 * Spins from the moment it mounts; once `target` arrives it slows down and
 * stops with that name under the pointer, then calls onSettled.
 */
export function WheelSpinner({
  names,
  target,
  onTick,
  onSettled,
}: WheelSpinnerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef<SVGSVGElement>(null);
  const state = useRef({ angle: 0, won: -1 });
  // the animation loop reads the newest props without restarting
  const latest = useRef({ names, target, onTick, onSettled });
  useLayoutEffect(() => {
    latest.current = { names, target, onTick, onSettled };
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);

    const draw = () => {
      const list = latest.current.names;
      const n = Math.max(list.length, 1);
      const seg = TAU / n;
      const r = SIZE / 2;
      const card = getComputedStyle(canvas).getPropertyValue("--card").trim();
      const fg = getComputedStyle(canvas).getPropertyValue("--foreground").trim();

      ctx.clearRect(0, 0, SIZE, SIZE);
      list.forEach((name, i) => {
        const start = -Math.PI / 2 + state.current.angle + i * seg;
        // four colours in turn; the last slice never matches the first
        const k = i === n - 1 && n > 1 && i % 4 === 0 ? DARK_TEXT_SLICE : i % 4;
        const won = state.current.won === i;

        ctx.beginPath();
        ctx.moveTo(r, r);
        ctx.arc(r, r, r - 5, start, start + seg);
        ctx.closePath();
        ctx.fillStyle = won ? "#f2c14e" : resolveColor(SLICE_COLORS[k], canvas);
        ctx.fill();
        ctx.strokeStyle = card;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.save();
        ctx.translate(r, r);
        ctx.rotate(start + seg / 2);
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        const fontSize = n > 14 ? 9 : n > 9 ? 10.5 : 12;
        ctx.font = `600 ${fontSize}px ui-sans-serif, system-ui, sans-serif`;
        ctx.fillStyle = won || k === DARK_TEXT_SLICE ? "#2a2520" : "#ffffff";
        const label = n > 10 ? name.split(" ")[0] : name;
        ctx.fillText(
          label.length > 15 ? `${label.slice(0, 14)}…` : label,
          r - 16,
          0,
        );
        ctx.restore();
      });

      ctx.beginPath();
      ctx.arc(r, r, r - 3, 0, TAU);
      ctx.strokeStyle = fg;
      ctx.lineWidth = 4;
      ctx.stroke();
    };

    // spin up right away; plan the stop once the server's answer is in
    let frame = 0;
    let last = performance.now();
    let speed = 0;
    let lastSlice = -1;
    let settle: { from: number; to: number; at: number } | null = null;

    const flick = () => {
      const n = Math.max(latest.current.names.length, 1);
      const turned = ((-state.current.angle % TAU) + TAU) % TAU;
      const slice = Math.floor(turned / (TAU / n));
      if (slice === lastSlice) return;
      lastSlice = slice;
      latest.current.onTick();
      pointerRef.current?.animate(
        [{ transform: "rotate(-18deg)" }, { transform: "rotate(0deg)" }],
        { duration: 140 },
      );
    };

    const finish = (index: number) => {
      const seg = TAU / Math.max(latest.current.names.length, 1);
      state.current.angle = -(index + 0.5) * seg;
      state.current.won = index;
      draw();
      latest.current.onSettled();
    };

    const loop = (now: number) => {
      const { target: index, names: list } = latest.current;

      if (settle) {
        const p = Math.min(1, (now - settle.at) / SETTLE_MS);
        state.current.angle = settle.from + (settle.to - settle.from) * easeOutQuart(p);
        draw();
        flick();
        if (p < 1) frame = requestAnimationFrame(loop);
        else finish(index!);
        return;
      }

      if (index !== null && prefersReducedMotion()) return finish(index);

      const dt = (now - last) / 1000;
      last = now;
      speed = Math.min(14, speed + dt * 30);
      state.current.angle += speed * dt;
      draw();
      flick();

      if (index !== null) {
        // land the winner's slice under the pointer, a little off-centre so
        // it looks like a real wheel, after at least four more turns
        const seg = TAU / Math.max(list.length, 1);
        const from = state.current.angle;
        let to = -(index + 0.5) * seg + (Math.random() - 0.5) * seg * 0.6;
        while (to < from + TAU * 4) to += TAU;
        settle = { from, to, at: now };
      }
      frame = requestAnimationFrame(loop);
    };

    draw();
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className='relative mx-auto' style={{ width: SIZE, height: SIZE }}>
      <svg
        ref={pointerRef}
        aria-hidden
        viewBox='0 0 26 34'
        className='absolute left-1/2 -top-2 z-10 h-[34px] w-[26px] -translate-x-1/2 drop-shadow'
        style={{ transformOrigin: "50% 8px" }}
      >
        <path d='M13 34 L2 8 A11 11 0 1 1 24 8 Z' className='fill-foreground' />
        <circle cx='13' cy='9' r='4' className='fill-card' />
      </svg>
      <canvas
        ref={canvasRef}
        role='img'
        aria-label='Spinning wheel of names'
        style={{ width: SIZE, height: SIZE }}
      />
      <div className='absolute left-1/2 top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[3px] border-primary bg-card font-heading text-xs'>
        Spin
      </div>
    </div>
  );
}
