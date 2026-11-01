"use client";

import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState, useRef } from "react";
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
  CELL_SIZE,
  CELL_GAP,
} from "@/lib/get-heatmap-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SnackHeatmap({
  data,
  joinedAt,
  title = "Snack Streak",
  description = "Your spending activity over time",
  variant = "default",
}: SnackHeatmapProps) {
  const isDetailed = variant === "detailed";
  const cellSize = isDetailed ? 15 : CELL_SIZE;
  const cellGap = isDetailed ? 3 : CELL_GAP;
  const step = cellSize + cellGap;
  const cellStyle = { width: cellSize, height: cellSize };
  const currentYear = new Date().getFullYear();
  const joinedYear = new Date(joinedAt).getFullYear();
  const startYear = Math.max(PLATFORM_YEAR, joinedYear);

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [hoveredDay, setHoveredDay] = useState<HeatmapDay | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // on narrow screens the detailed map opens on the latest weeks, not on January
  useEffect(() => {
    if (isDetailed && scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [isDetailed, selectedYear]);

  const yearOptions = buildYearOptions(startYear);
  const weeks = buildWeeks(data, selectedYear);
  const monthLabels = getMonthLabels(weeks);
  const joinedKey = format(new Date(joinedAt), "yyyy-MM-dd");
  // days before the org existed are faded like future days
  const beforeJoin = (date: string) => isDetailed && date < joinedKey;

  const pastDays = weeks
    .flat()
    .filter((cell) => cell && !cell.future && !beforeJoin(cell.date));
  const totalSpent = pastDays.reduce((sum, cell) => sum + (cell?.spent ?? 0), 0);
  const daysWithOrders = pastDays.filter((cell) => (cell?.spent ?? 0) > 0).length;
  const biggestDay = pastDays.reduce<(typeof pastDays)[number]>(
    (best, cell) => ((cell?.spent ?? 0) > (best?.spent ?? 0) ? cell : best),
    null,
  );

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
    <Card size='sm'>
      {/* Header */}
      <div className=''>
        <CardHeader className='mb-3 flex items-start justify-between'>
          <div>
            <CardTitle>{title}</CardTitle>
            <p className='text-sm text-muted-foreground'>
              {description}
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
        </CardHeader>
      </div>

      {isDetailed && (
        <div className='-mt-3 mb-1 flex flex-wrap gap-x-6 gap-y-1 px-5 text-sm text-muted-foreground'>
          <span>
            Total{" "}
            <span className='font-semibold text-foreground tabular-nums'>
              ₹{Math.round(totalSpent).toLocaleString("en-IN")}
            </span>
          </span>
          <span>
            Ordered on{" "}
            <span className='font-semibold text-foreground tabular-nums'>
              {daysWithOrders}
            </span>{" "}
            {daysWithOrders === 1 ? "day" : "days"}
          </span>
          {biggestDay && biggestDay.spent > 0 && (
            <span>
              Biggest day{" "}
              <span className='font-semibold text-foreground'>
                {format(new Date(biggestDay.date), "EEE, d MMM")}
              </span>
            </span>
          )}
        </div>
      )}

      <CardContent ref={scrollRef} className='overflow-x-scroll [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'>
        <div className='w-fit mx-auto flex gap-2'>
          {isDetailed && (
            <div
              aria-hidden
              className='flex flex-col text-[10px] text-muted-foreground'
              style={{ gap: cellGap, paddingTop: 40 }}
            >
              {["", "Mon", "", "Wed", "", "Fri", ""].map((day, i) => (
                <span key={i} style={{ height: cellSize, lineHeight: `${cellSize}px` }}>
                  {day}
                </span>
              ))}
            </div>
          )}
          <div className='relative' ref={containerRef}>
            {/* Month labels */}
            <div className='relative h-9 mb-1'>
              {monthLabels.map(({ label, colIndex }) => (
                <span
                  key={label + colIndex}
                  className='absolute text-xs text-muted-foreground'
                  style={{ left: colIndex * step }}
                >
                  {label}
                </span>
              ))}
            </div>

            {/* Grid */}
            <div className='flex' style={{ gap: cellGap }}>
              {weeks.map((week, wi) => (
                <div key={wi} className='flex flex-col' style={{ gap: cellGap }}>
                  {week.map((cell, di) =>
                    cell === null ? (
                      <div key={di} style={cellStyle} />
                    ) : cell.future || beforeJoin(cell.date) ? (
                      <div
                        key={cell.date}
                        style={cellStyle}
                        className='rounded-sm bg-muted opacity-40'
                      />
                    ) : (
                      <div
                        key={cell.date}
                        style={cellStyle}
                        className={cn(
                          "rounded-sm cursor-pointer",
                          getIntensity(cell.spent),
                          // no-order days a step lighter than the faded ones
                          isDetailed && cell.spent === 0 && "bg-muted-foreground/20",
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
          <div className='h-3 w-3 rounded-sm bg-primary/30' />
          <div className='h-3 w-3 rounded-sm bg-primary/60' />
          <div className='h-3 w-3 rounded-sm bg-primary' />
          <span>More</span>
          {isDetailed && (
            <span className='ml-auto'>
              Faded squares are before the org started or still to come
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
