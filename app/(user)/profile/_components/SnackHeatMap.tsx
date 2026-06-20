"use client";

import {
  format,
  startOfYear,
  endOfYear,
  eachWeekOfInterval,
  addDays,
  isAfter,
  isBefore,
} from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useState, useRef } from "react";

export interface HeatmapDay {
  date: string;
  orders: number;
}

interface SnackHeatmapProps {
  data: HeatmapDay[];
}

const CELL_SIZE = 12;
const CELL_GAP = 4;
const STEP = CELL_SIZE + CELL_GAP;

function getIntensity(orders: number) {
  if (orders === 0) return "bg-muted";
  if (orders === 1) return "bg-green-200 dark:bg-green-950";
  if (orders === 2) return "bg-green-400 dark:bg-green-800";
  return "bg-green-600 dark:bg-green-600";
}

// Each cell: null = outside Jan 1 boundary, { date, orders, future: true } = future spacer, { date, orders, future: false } = real
type Cell = null | { date: string; orders: number; future: boolean };

function buildWeeks(data: HeatmapDay[]): Cell[][] {
  const dataMap = new Map(data.map((d) => [d.date, d.orders]));
  const today = new Date();
  const yearStart = startOfYear(today);
  const yearEnd = endOfYear(today);

  const weeks = eachWeekOfInterval(
    { start: yearStart, end: yearEnd },
    { weekStartsOn: 0 },
  );

  return weeks.map((weekStart) =>
    Array.from({ length: 7 }, (_, i): Cell => {
      const date = addDays(weekStart, i);
      // Before Jan 1 → invisible spacer (null)
      if (isBefore(date, yearStart)) return null;
      const key = format(date, "yyyy-MM-dd");
      const future = isAfter(date, today);
      return {
        date: key,
        orders: future ? 0 : (dataMap.get(key) ?? 0),
        future,
      };
    }),
  );
}

function getMonthLabels(weeks: Cell[][]) {
  const seen = new Map<number, number>(); // month → first colIndex

  weeks.forEach((week, colIndex) => {
    week.forEach((cell) => {
      if (!cell) return; // skip pre-Jan nulls
      const month = new Date(cell.date).getMonth();
      if (!seen.has(month)) seen.set(month, colIndex);
    });
  });

  return Array.from(seen.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([month, colIndex]) => ({
      label: format(new Date(new Date().getFullYear(), month, 1), "MMM"),
      colIndex,
    }));
}

export function SnackHeatmap({ data }: SnackHeatmapProps) {
  const [hoveredDay, setHoveredDay] = useState<HeatmapDay | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const weeks = buildWeeks(data);
  const monthLabels = getMonthLabels(weeks);

  const handleMouseEnter = (
    day: HeatmapDay,
    e: React.MouseEvent<HTMLDivElement>,
  ) => {
    const container = containerRef.current;
    if (!container) return;
    const cell = e.currentTarget;

    // Walk up the DOM summing offsetTop/offsetLeft until we hit containerRef
    let x = cell.offsetLeft + cell.offsetWidth / 2;
    let y = cell.offsetTop + cell.offsetHeight / 2;
    let el = cell.offsetParent as HTMLElement | null;

    while (el && el !== container) {
      x += el.offsetLeft;
      y += el.offsetTop;
      el = el.offsetParent as HTMLElement | null;
    }

    setHoveredDay(day);
    setTooltipPos({ x, y });
  };

  return (
    <div className='border w-fit bg-card p-6'>
      <div className='mb-6'>
        <h2 className='text-lg font-semibold'>Snack Streak</h2>
        <p className='text-sm text-muted-foreground'>
          Your ordering activity over time
        </p>
      </div>

      <div className='overflow-x-auto overflow-y-visible'>
        <div className='relative min-w-max' ref={containerRef}>
          {/* Month labels */}
          <div className='relative h-5 mb-1'>
            {monthLabels.map(({ label, colIndex }) => (
              <span
                key={label + colIndex}
                className='absolute text-xs text-muted-foreground'
                style={{ left: colIndex * STEP }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Grid */}
          <div className='flex gap-1'>
            {weeks.map((week, wi) => (
              <div key={wi} className='flex flex-col gap-1'>
                {week.map((cell, di) =>
                  cell === null ? (
                    // Pre-Jan 1 invisible spacer
                    <div key={di} className='h-3 w-3' />
                  ) : cell.future ? (
                    // Future date — dimmed, no hover
                    <div
                      key={cell.date}
                      className='h-3 w-3 rounded-sm bg-muted opacity-40'
                    />
                  ) : (
                    <div
                      key={cell.date}
                      className={cn(
                        "h-3 w-3 rounded-sm cursor-pointer",
                        getIntensity(cell.orders),
                      )}
                      onMouseEnter={(e) =>
                        handleMouseEnter(
                          { date: cell.date, orders: cell.orders },
                          e,
                        )
                      }
                      onMouseLeave={() => setHoveredDay(null)}
                    />
                  ),
                )}
              </div>
            ))}
          </div>

          {/* Tooltip */}
          <AnimatePresence>
            {hoveredDay && (
              <motion.div
                key={hoveredDay.date}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.12 }}
                className='absolute pointer-events-none z-50 bg-popover text-popover-foreground px-3 py-1.5 rounded-md shadow-lg border text-sm whitespace-nowrap'
                style={{
                  left: tooltipPos.x - 80,
                  bottom: `calc(100% - ${tooltipPos.y}px + 10px)`, // position above the cell
                  transform: "translateX(-50%)",
                }}
              >
                <span className='font-medium'>
                  {hoveredDay.orders} order{hoveredDay.orders !== 1 ? "s" : ""}{" "}
                  on {format(new Date(hoveredDay.date), "MMMM do")}
                </span>
                <div className='absolute -bottom-[5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-popover border-r border-b border-border rotate-45' />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Legend */}
      <div className='mt-4 flex items-center gap-2 text-xs text-muted-foreground'>
        <span>Less</span>
        <div className='h-3 w-3 rounded-sm bg-muted' />
        <div className='h-3 w-3 rounded-sm bg-green-200 dark:bg-green-950' />
        <div className='h-3 w-3 rounded-sm bg-green-400 dark:bg-green-800' />
        <div className='h-3 w-3 rounded-sm bg-green-600' />
        <span>More</span>
      </div>
    </div>
  );
}
