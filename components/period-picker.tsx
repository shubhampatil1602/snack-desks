"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Calendar, Infinity } from "lucide-react";
import {
  generateMonthsFromDate,
  getYearsFromMonths,
  groupMonthsByYear,
  getPeriodLabel,
  isAllTimeView,
  isYearView,
  isMonthView,
  getActivePeriod,
} from "@/lib/period-utils";

interface Props {
  period: string | undefined;
  startDate: Date;
  basePath: string;
}

export function PeriodPicker({ period, startDate, basePath }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const months = generateMonthsFromDate(startDate);
  const years = getYearsFromMonths(months);
  const monthsByYear = groupMonthsByYear(months, years);

  const currentLabel = getPeriodLabel(period, months);
  const activePeriod = getActivePeriod(period);

  const handlePeriodChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("period");
    } else {
      params.set("period", value);
    }
    const queryString = params.toString();
    router.push(`${basePath}${queryString ? `?${queryString}` : ""}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='outline'
          className='flex h-10 items-center gap-2 px-3 min-w-[150px] justify-between hover:bg-accent/50 transition-colors'
        >
          <Calendar className='h-4 w-4 text-muted-foreground' />
          <span className='truncate font-medium'>{currentLabel}</span>
          <ChevronDown className='h-4 w-4 text-muted-foreground' />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end' className='w-[220px]'>
        <DropdownMenuItem
          onSelect={() => handlePeriodChange("all")}
          className={isAllTimeView(period) ? "bg-accent" : ""}
        >
          <Infinity className='h-4 w-4 mr-2' />
          <span className='font-medium'>All Time</span>
          {isAllTimeView(period) && (
            <span className='ml-auto text-xs text-muted-foreground'>✓</span>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <div className='px-2 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-2'>
          <span>Years</span>
          <span className='text-[10px] text-muted-foreground/60'>
            (click for full year)
          </span>
        </div>
        {years.map((year) => (
          <DropdownMenuItem
            key={year}
            onSelect={() => handlePeriodChange(year)}
            className={isYearView(period) && activePeriod === year ? "bg-accent" : ""}
          >
            <span>{year}</span>
            {isYearView(period) && activePeriod === year && (
              <span className='ml-auto text-xs text-muted-foreground'>✓</span>
            )}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <div className='px-2 py-1.5 text-xs font-medium text-muted-foreground'>
          Months
        </div>

        {years.map((year) => {
          const yearMonths = monthsByYear[year] || [];
          if (yearMonths.length === 0) return null;

          return (
            <DropdownMenuSub key={year}>
              <DropdownMenuSubTrigger className='flex items-center justify-between'>
                <span>{year}</span>
                <span className='text-[10px] text-muted-foreground/60'>
                  {yearMonths.length} months
                </span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className='w-[200px]'>
                  <DropdownMenuItem
                    onSelect={() => handlePeriodChange(year)}
                    className={
                      isYearView(period) && activePeriod === year ? "bg-accent" : ""
                    }
                  >
                    <span className='font-medium'>Full Year</span>
                    {isYearView(period) && activePeriod === year && (
                      <span className='ml-auto text-xs text-muted-foreground'>
                        ✓
                      </span>
                    )}
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {yearMonths.map((m) => (
                    <DropdownMenuItem
                      key={m.value}
                      onSelect={() => handlePeriodChange(m.value)}
                      className={
                        isMonthView(period) && activePeriod === m.value
                          ? "bg-accent"
                          : ""
                      }
                    >
                      <span>{m.label}</span>
                      {isMonthView(period) && activePeriod === m.value && (
                        <span className='ml-auto text-xs text-muted-foreground'>
                          ✓
                        </span>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
