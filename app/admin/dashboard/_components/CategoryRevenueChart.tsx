"use client";

import { Cell, Label, Pie, PieChart } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CategoryRevenueSlice } from "@/modules/admin-dashboard/queries";
import { formatCurrency } from "@/lib/utils";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

type CategoryRevenueChartProps = {
  data: CategoryRevenueSlice[];
  periodLabel: string;
  title?: string;
  description?: string;
};

export function CategoryRevenueChart({
  data,
  periodLabel,
  title = "Revenue by category",
  description,
}: CategoryRevenueChartProps) {
  const chartConfig = data.reduce<
    Record<string, { label: string; color: string }>
  >((acc, slice, index) => {
    acc[slice.category] = {
      label: slice.category,
      color: CHART_COLORS[index % CHART_COLORS.length],
    };
    return acc;
  }, {});

  const topShare = data[0]?.share ?? 0;

  return (
    <Card size="sm" className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {description ?? `Share of approved spend · ${periodLabel}`}
        </p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No category breakdown for this period.
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[280px] w-full max-w-md">
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    nameKey="category"
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
                data={data}
                dataKey="revenue"
                nameKey="category"
                innerRadius={72}
                outerRadius={108}
                paddingAngle={2}
                stroke="var(--card)"
                strokeWidth={2}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={entry.category}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy ?? 0) - 6}
                            className="fill-foreground text-2xl font-bold"
                          >
                            {topShare}%
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy ?? 0) + 16}
                            className="fill-muted-foreground text-xs"
                          >
                            top category
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </Pie>
              <ChartLegend content={<ChartLegendContent nameKey="category" />} />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
