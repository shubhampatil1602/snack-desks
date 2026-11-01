"use client";

import { ChevronRight } from "lucide-react";
import { Cell, Label, Pie, PieChart } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { CategoryRevenueSlice } from "@/modules/admin-dashboard/queries";
import { formatCurrency } from "@/lib/utils";

// colour-blind-safe category colours, light then dark; categories past
// the top five share one "Other" slice, so the card never grows
const CATEGORY_COLORS =
  "[--cat-1:#2a78d6] [--cat-2:#eb6834] [--cat-3:#1baf7a] [--cat-4:#eda100] [--cat-5:#e87ba4] [--cat-6:#6250d6] " +
  "dark:[--cat-1:#3987e5] dark:[--cat-2:#d95926] dark:[--cat-3:#199e70] dark:[--cat-4:#c98500] dark:[--cat-5:#d55181] dark:[--cat-6:#9085e9]";
const TOP_CATEGORIES = 5;

type CategoryRevenueChartProps = {
  data: CategoryRevenueSlice[];
  periodLabel: string;
  title?: string;
  description?: string;
};

// "<1%" rather than a misleading "0%" for a small but real share
function formatShare(share: number) {
  if (share > 0 && share < 1) return "<1%";
  return `${Math.round(share)}%`;
}

type Slice = CategoryRevenueSlice & { others?: CategoryRevenueSlice[] };

// top five, then the rest as one "Other" slice (only when two or more are left)
function withOther(rows: CategoryRevenueSlice[]): Slice[] {
  // shares from the amounts, unrounded, so a small category reads "<1%"
  const total = rows.reduce((sum, row) => sum + row.revenue, 0) || 1;
  const data = rows.map((row) => ({ ...row, share: (row.revenue / total) * 100 }));
  if (data.length <= TOP_CATEGORIES + 1) return data;
  const rest = data.slice(TOP_CATEGORIES);
  return [
    ...data.slice(0, TOP_CATEGORIES),
    {
      category: "Other",
      revenue: rest.reduce((sum, slice) => sum + slice.revenue, 0),
      share: rest.reduce((sum, slice) => sum + slice.share, 0),
      others: rest,
    },
  ];
}

export function CategoryRevenueChart({
  data,
  periodLabel,
  title = "Revenue by category",
  description,
}: CategoryRevenueChartProps) {
  const slices = withOther(data);
  // "Other" is grey so it never reads as one more category
  const colorOf = (index: number) =>
    slices[index]?.others ? "var(--muted-foreground)" : `var(--cat-${index + 1})`;

  const chartConfig = slices.reduce<
    Record<string, { label: string; color: string }>
  >((acc, slice, index) => {
    acc[slice.category] = { label: slice.category, color: colorOf(index) };
    return acc;
  }, {});

  const top = slices[0];
  const topRevenue = top?.revenue || 1;

  return (
    <Card size='sm' className='h-full'>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className='text-sm text-muted-foreground'>
          {description ?? `Share of approved spend · ${periodLabel}`}
        </p>
      </CardHeader>
      <CardContent className='flex flex-1 items-center'>
        {slices.length === 0 ? (
          <p className='w-full py-12 text-center text-sm text-muted-foreground'>
            No category breakdown for this period.
          </p>
        ) : (
          <div
            className={`grid w-full items-center gap-6 sm:grid-cols-[13rem_minmax(0,1fr)] ${CATEGORY_COLORS}`}
          >
            <ChartContainer
              config={chartConfig}
              className='mx-auto aspect-square w-52'
            >
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      nameKey='category'
                      formatter={(value, name, item) => {
                        const share = item?.payload?.share;
                        return [
                          `${formatCurrency(Number(value))}${share != null ? ` (${share}%)` : ""}`,
                          String(name),
                        ];
                      }}
                    />
                  }
                />
                <Pie
                  data={slices}
                  dataKey='revenue'
                  nameKey='category'
                  innerRadius={66}
                  outerRadius={98}
                  paddingAngle={1.5}
                  stroke='var(--card)'
                  strokeWidth={2}
                >
                  {slices.map((entry, index) => (
                    <Cell key={entry.category} fill={colorOf(index)} />
                  ))}
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor='middle'
                            dominantBaseline='middle'
                          >
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy ?? 0) - 6}
                              className='fill-foreground text-2xl font-bold'
                            >
                              {formatShare(top.share)}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy ?? 0) + 16}
                              className='fill-muted-foreground text-xs'
                            >
                              {top.category}
                            </tspan>
                          </text>
                        );
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>

            {/* every category named, with a bar against the biggest, ₹ and share */}
            <ul className='grid gap-2 text-sm'>
              {slices.map((slice, index) => {
                const row = (
                  <CategoryRow
                    slice={slice}
                    color={colorOf(index)}
                    width={(slice.revenue / topRevenue) * 100}
                  />
                );
                if (!slice.others) return <li key={slice.category}>{row}</li>;

                // "Other" opens the categories it groups, by tap or click
                return (
                  <li key={slice.category}>
                    <Popover>
                      <PopoverTrigger className='w-full text-left outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring'>
                        {row}
                      </PopoverTrigger>
                      <PopoverContent align='end' className='w-72 gap-2 p-3'>
                        <p className='text-xs font-semibold text-muted-foreground'>
                          In Other
                        </p>
                        <ul className='grid max-h-64 gap-1.5 overflow-y-auto text-sm'>
                          {slice.others.map((other) => (
                            <li
                              key={other.category}
                              className='grid grid-cols-[minmax(0,1fr)_auto_3.5ch] gap-2.5'
                            >
                              <span className='truncate'>{other.category}</span>
                              <span className='font-semibold tabular-nums'>
                                {formatCurrency(other.revenue)}
                              </span>
                              <span className='text-right text-xs text-muted-foreground tabular-nums'>
                                {formatShare(other.share)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </PopoverContent>
                    </Popover>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CategoryRow({
  slice,
  color,
  width,
}: {
  slice: Slice;
  color: string;
  width: number;
}) {
  return (
    <span className='grid grid-cols-[0.625rem_minmax(0,1fr)_auto_3.5ch] items-center gap-x-2.5 gap-y-1'>
      <span aria-hidden className='size-2.5 rounded-[2px]' style={{ background: color }} />
      <span className='flex min-w-0 items-center gap-1'>
        <span className='truncate'>{slice.category}</span>
        {slice.others && (
          <span className='inline-flex shrink-0 items-center text-xs text-muted-foreground'>
            · {slice.others.length}
            <ChevronRight className='size-3.5' />
          </span>
        )}
      </span>
      <span className='whitespace-nowrap text-right font-semibold tabular-nums'>
        {formatCurrency(slice.revenue)}
      </span>
      <span className='text-right text-xs text-muted-foreground tabular-nums'>
        {formatShare(slice.share)}
      </span>
      <span aria-hidden className='col-span-3 col-start-2 h-1 bg-muted'>
        <span
          className='block h-full'
          style={{ width: `${Math.max(1, width)}%`, background: color }}
        />
      </span>
    </span>
  );
}
