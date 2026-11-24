"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChartDay } from "@/modules/strava/queries";
import { RunScoreInfo } from "./RunScoreInfo";

const distanceConfig = {
  run: { label: "Run", color: "var(--chart-1)" },
  walk: { label: "Walk", color: "var(--chart-2)" },
  other: { label: "Other", color: "var(--chart-4)" },
};

const scoreConfig = {
  score: { label: "Run score", color: "var(--chart-1)" },
};

export function StravaDistanceChart({ data }: { data: ChartDay[] }) {
  return (
    <Card size='sm' className='h-full'>
      <CardHeader>
        <CardTitle>Distance</CardTitle>
        <p className='text-sm text-muted-foreground'>
          Kilometres per day, last 30 days
        </p>
      </CardHeader>
      <CardContent>
        <ChartContainer config={distanceConfig} className='h-[240px] w-full'>
          <BarChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray='4 4' />
            <XAxis
              dataKey='label'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
            />
            <YAxis tickLine={false} axisLine={false} width={32} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => [
                    `${Number(value).toFixed(2)} km`,
                    ` ${distanceConfig[name as keyof typeof distanceConfig]?.label ?? name}`,
                  ]}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey='run' stackId='km' fill='var(--color-run)' />
            <Bar dataKey='walk' stackId='km' fill='var(--color-walk)' />
            <Bar dataKey='other' stackId='km' fill='var(--color-other)' />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function StravaScoreChart({ data }: { data: ChartDay[] }) {
  const hasScores = data.some((day) => day.score !== null);

  return (
    <Card size='sm' className='h-full'>
      <CardHeader>
        <CardTitle className='flex items-center gap-1'>
          Run score
          <RunScoreInfo />
        </CardTitle>
        <p className='text-sm text-muted-foreground'>
          Your score on days you ran, last 30 days
        </p>
      </CardHeader>
      <CardContent>
        {!hasScores ? (
          <p className='py-12 text-center text-sm text-muted-foreground'>
            No scoring runs in the last 30 days.
          </p>
        ) : (
          <ChartContainer config={scoreConfig} className='h-[240px] w-full'>
            <LineChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray='4 4' />
              <XAxis
                dataKey='label'
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={24}
              />
              <YAxis tickLine={false} axisLine={false} width={32} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type='monotone'
                dataKey='score'
                stroke='var(--color-score)'
                strokeWidth={2}
                connectNulls
                dot={{ r: 3 }}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
