"use client";

import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useState, useRef } from "react";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HeatmapDay, SnackHeatmapProps } from "@/types/profile";
import {
  buildWeeks,
  buildYearOptions,
  getIntensity,
  getMonthLabels,
  PLATFORM_YEAR,
  STEP,
} from "../_lib/get-heatmap-data";

export function SnackHeatmap({ data, joinedAt }: SnackHeatmapProps) {
  const currentYear = new Date().getFullYear();
  const joinedYear = new Date(joinedAt).getFullYear();
  const startYear = Math.max(PLATFORM_YEAR, joinedYear);

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [hoveredDay, setHoveredDay] = useState<HeatmapDay | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const yearOptions = buildYearOptions(startYear);
  const weeks = buildWeeks(data, selectedYear);
  const monthLabels = getMonthLabels(weeks);

  const handleMouseEnter = (
    day: HeatmapDay,
    e: React.MouseEvent<HTMLDivElement>,
  ) => {
    const container = containerRef.current;
    if (!container) return;
    const cell = e.currentTarget;

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
    <div className='border bg-card p-4 w-full'>
      {/* Header */}
      <div className='mb-6 flex items-start justify-between'>
        <div>
          <h2 className='text-lg font-semibold'>Snack Streak</h2>
          <p className='text-sm text-muted-foreground'>
            Your spending activity over time
          </p>
        </div>

        {/* Year dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className='flex h-8 items-center gap-1.5 border bg-background px-3 text-sm text-foreground focus:outline-none data-[state=open]:bg-muted'>
            {selectedYear}
            <ChevronDown className='h-3.5 w-3.5 text-muted-foreground' />
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='min-w-[80px]'>
            {yearOptions.map((y) => (
              <DropdownMenuItem
                key={y}
                onSelect={() => {
                  setHoveredDay(null);
                  setSelectedYear(y);
                }}
                className={cn(
                  "text-sm",
                  y === selectedYear && "font-medium text-foreground",
                )}
              >
                {y}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className='overflow-x-scroll'>
        <div className='w-fit mx-auto'>
          <div className='relative' ref={containerRef}>
            {/* Month labels */}
            <div className='relative h-6 mb-1'>
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
                      <div key={di} className='h-3 w-3' />
                    ) : cell.future ? (
                      <div
                        key={cell.date}
                        className='h-3 w-3 rounded-sm bg-muted opacity-40'
                      />
                    ) : (
                      <div
                        key={cell.date}
                        className={cn(
                          "h-3 w-3 rounded-sm cursor-pointer",
                          getIntensity(cell.spent),
                        )}
                        onMouseEnter={(e) =>
                          handleMouseEnter(
                            { date: cell.date, spent: cell.spent },
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
                    left: tooltipPos.x - 102,
                    bottom: `calc(100% - ${tooltipPos.y}px + 10px)`,
                    transform: "translateX(-50%)",
                  }}
                >
                  <span className='font-medium'>
                    {hoveredDay.spent === 0
                      ? "Nothing spent on "
                      : `₹${hoveredDay.spent.toFixed(2)} spent on `}
                    {format(new Date(hoveredDay.date), "MMMM do")}
                  </span>
                  {/* <div className='absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-popover border-r border-b border-border rotate-45' /> */}
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
    </div>
  );
}
