"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RevenueTimeSeriesPoint } from "@/modules/admin-dashboard/queries";
import { formatCurrency } from "@/lib/utils";

type RevenueTrendChartProps = {
  data: RevenueTimeSeriesPoint[];
  periodLabel: string;
  title?: string;
  description?: string;
  valueLabel?: string;
};

export function RevenueTrendChart({
  data,
  periodLabel,
  title = "Revenue trend",
  description,
  valueLabel = "Revenue",
}: RevenueTrendChartProps) {
  const chartConfig = {
    revenue: {
      label: valueLabel,
      color: "var(--chart-1)",
    },
    orders: {
      label: "Orders",
      color: "var(--chart-2)",
    },
  };

  return (
    <Card size='sm' className='h-full'>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className='text-sm text-muted-foreground'>
          {description ?? `Approved order revenue and volume · ${periodLabel}`}
        </p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className='py-12 text-center text-sm text-muted-foreground'>
            No approved orders in this period yet.
          </p>
        ) : (
          <ChartContainer
            config={chartConfig}
            className='aspect-[16/9] h-[280px] w-full'
          >
            <LineChart data={data} margin={{ left: 8, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray='4 4' />
              <XAxis
                dataKey='label'
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={24}
              />
              <YAxis
                yAxisId='revenue'
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) =>
                  value >= 1000 ? `₹${Math.round(value / 1000)}k` : `₹${value}`
                }
              />
              <YAxis
                yAxisId='orders'
                orientation='right'
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                allowDecimals={false}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => {
                      if (name === "revenue") {
                        return [formatCurrency(Number(value)), ` ${valueLabel}`];
                      }
                      return [value, " Orders"];
                    }}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                yAxisId='revenue'
                type='monotone'
                dataKey='revenue'
                stroke='var(--color-revenue)'
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                yAxisId='orders'
                type='monotone'
                dataKey='orders'
                stroke='var(--color-orders)'
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
