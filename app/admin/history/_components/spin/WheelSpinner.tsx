"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { followLegs, prefersReducedMotion, teaseLegs } from "./use-spin-sound";

type WheelSpinnerProps = {
  names: string[];
  // false shows the wheel standing still, as a preview of who is in the draw
  spinning: boolean;
  // index into names once the server has picked; null while waiting
  target: number | null;
  onTick: () => void;
  onSettled: () => void;
};

// big enough for 30 names; scales down to fit narrow or short screens
const SIZE = 460;
// radius of the "Spin" hub in the middle, which names stop short of
const HUB = 30;
const TAU = Math.PI * 2;
// brand orange, a warm sand and two greys, taken in turn
const SLICE_COLORS = ["var(--primary)", "#5b5650", "#e2a76f", "#3f3b37"];
const DARK_TEXT_SLICE = 2;

function resolveColor(color: string, el: HTMLElement) {
  if (!color.startsWith("var(")) return color;
  return getComputedStyle(el).getPropertyValue(color.slice(4, -1)).trim();
}

// the full name if it fits along the slice, else the first name, else cut
function fitLabel(ctx: CanvasRenderingContext2D, name: string, room: number) {
  const fits = (text: string) => ctx.measureText(text).width <= room;
  if (fits(name)) return name;
  const first = name.split(" ")[0];
  if (fits(first)) return first;
  let cut = first;
  while (cut.length > 1 && !fits(`${cut}…`)) cut = cut.slice(0, -1);
  return `${cut}…`;
}

function paint(canvas: HTMLCanvasElement, names: string[], angle: number, won: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  if (canvas.width !== SIZE * dpr) {
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const n = Math.max(names.length, 1);
  const seg = TAU / n;
  const r = SIZE / 2;
  const card = getComputedStyle(canvas).getPropertyValue("--card").trim();
  const fg = getComputedStyle(canvas).getPropertyValue("--foreground").trim();

  ctx.clearRect(0, 0, SIZE, SIZE);
  names.forEach((name, i) => {
    // angle 0 is where the pointer is, at the right
    const start = angle + i * seg;
    // four colours in turn; the last slice never matches the first
    const k = i === n - 1 && n > 1 && i % 4 === 0 ? DARK_TEXT_SLICE : i % 4;
    const isWinner = won === i;

    ctx.beginPath();
    ctx.moveTo(r, r);
    ctx.arc(r, r, r - 5, start, start + seg);
    ctx.closePath();
    ctx.fillStyle = isWinner ? "#f2c14e" : resolveColor(SLICE_COLORS[k], canvas);
    ctx.fill();
    ctx.strokeStyle = card;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.translate(r, r);
    ctx.rotate(start + seg / 2);
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    // as big as the slice allows halfway out, between 9px and 15px
    const fontSize = Math.max(9, Math.min(15, (r / 2) * seg * 0.6));
    ctx.font = `600 ${fontSize}px ui-sans-serif, system-ui, sans-serif`;
    ctx.fillStyle = isWinner || k === DARK_TEXT_SLICE ? "#2a2520" : "#ffffff";
    ctx.fillText(fitLabel(ctx, name, r - 18 - HUB - 8), r - 18, 0);
    ctx.restore();
  });

  ctx.beginPath();
  ctx.arc(r, r, r - 3, 0, TAU);
  ctx.strokeStyle = fg;
  ctx.lineWidth = 4;
  ctx.stroke();
}

/**
 * Stands still until `spinning`, then spins; once `target` arrives it stops
 * just short of that name, goes round once more, runs a little past it and
 * swings back onto it, then calls onSettled.
 */
export function WheelSpinner({
  names,
  spinning,
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

  // the preview: redraw when the names change while standing still
  useEffect(() => {
    if (spinning || !canvasRef.current) return;
    paint(canvasRef.current, names, state.current.angle, state.current.won);
  }, [names, spinning]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!spinning || !canvas) return;

    const draw = () =>
      paint(canvas, latest.current.names, state.current.angle, state.current.won);

    // spin up right away; plan the stop once the server's answer is in
    let frame = 0;
    let last = performance.now();
    let speed = 0;
    let lastSlice = -1;
    let settle: { from: number; legs: ReturnType<typeof teaseLegs>; at: number } | null =
      null;

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
      if (!settle) state.current.angle = -(index + 0.5) * seg;
      state.current.won = index;
      draw();
      latest.current.onSettled();
    };

    const loop = (now: number) => {
      const { target: index, names: list } = latest.current;

      if (settle) {
        const { value, done } = followLegs(settle.from, settle.legs, now - settle.at);
        state.current.angle = value;
        draw();
        flick();
        if (done) finish(index!);
        else frame = requestAnimationFrame(loop);
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
        // in slices: land a little off-centre so it looks like a real wheel,
        // stop first just inside the slice before, and on the way back in
        // run just into the slice after
        const seg = TAU / Math.max(list.length, 1);
        const from = state.current.angle;
        const offCentre = (Math.random() - 0.5) * 0.5;
        const nearMiss = (0.65 + offCentre) * seg;
        const overshoot = Math.min((0.7 - offCentre) * seg, 0.9);
        let to = -(index + 0.5 - offCentre) * seg;
        // at least three more turns before the first stop
        while (to - TAU - nearMiss < from + TAU * 3) to += TAU;
        settle = { from, legs: teaseLegs(to, TAU, nearMiss, overshoot), at: now };
      }
      frame = requestAnimationFrame(loop);
    };

    draw();
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [spinning]);

  return (
    <div
      className='relative mx-auto aspect-square'
      style={{ width: `min(100%, ${SIZE}px, 56vh)` }}
    >
      {/* on the right, clear of the header, over the rim and pointing in;
          outlined so it stands out on any slice */}
      <svg
        ref={pointerRef}
        aria-hidden
        viewBox='0 0 52 34'
        className='absolute top-1/2 -right-6 z-10 h-[34px] w-[52px] -translate-y-1/2 drop-shadow-md'
        style={{ transformOrigin: "34px 17px" }}
      >
        <path
          d='M2 17 L29 4 A14 14 0 1 1 29 30 Z'
          className='fill-primary stroke-card'
          strokeWidth={2.5}
          strokeLinejoin='round'
        />
        <circle cx='34' cy='17' r='5' className='fill-card' />
      </svg>
      <canvas
        ref={canvasRef}
        role='img'
        aria-label={`Wheel of names: ${names.join(", ")}`}
        className='size-full'
      />
      <div className='absolute left-1/2 top-1/2 grid size-15 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[3px] border-primary bg-card font-heading text-xs'>
        Spin
      </div>
    </div>
  );
}
