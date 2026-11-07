"use client";

import { Calendar, ChevronDown } from "lucide-react";

import {
  ChartsSkeleton,
  HeatmapSkeleton,
} from "@/app/admin/dashboard/_components/DashboardSkeletons";
import { RecentWindowsCard } from "@/app/admin/dashboard/_components/RecentWindowsCard";
import { TopEmployeesCard } from "@/app/admin/dashboard/_components/TopEmployeesCard";
import { TopSellingItemsCard } from "@/app/admin/dashboard/_components/TopSellingItemsCard";
import { TopWindowWinnersCard } from "@/app/admin/dashboard/_components/TopWindowWinnersCard";
import { StatGroup } from "@/components/dashboard/StatGroup";
import { CategoryRevenueChart, RevenueTrendChart, SampleHeatmap } from "./demo-charts";
import { DemoRoastCard } from "./DemoRoastCard";
import { DemoWindowCard } from "./DemoWindowCard";
import { WhenVisible } from "./WhenVisible";
import {
  categoryRevenue,
  orderStats,
  rankings,
  recentWindows,
  revenueStats,
  revenueTrend,
  SAMPLE_PERIOD,
  topItems,
  windowWinners,
} from "./sample-data";

// The real admin dashboard's cards with sample data, in the same order, so
// this can't drift from the app. Cards that link into the admin area are
// inert: a click there would only send a visitor to the login page.
// Until `full`, it stops after the roast, so the charts load only on request.
export function DemoDashboard({
  full,
  onViewOrders,
}: {
  full: boolean;
  onViewOrders: () => void;
}) {
  return (
    <div className='space-y-3 p-4'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='mb-1'>
          <p className='font-heading text-2xl tracking-wide'>Hello, Meera</p>
          <p className='mt-1 text-sm text-muted-foreground'>
            Here&apos;s what&apos;s happening across your organization.
          </p>
        </div>
        <div className='flex h-10 min-w-[150px] items-center justify-between gap-2 border px-3 text-sm'>
          <Calendar className='h-4 w-4 text-muted-foreground' />
          <span className='truncate font-medium'>{SAMPLE_PERIOD}</span>
          <ChevronDown className='h-4 w-4 text-muted-foreground' />
        </div>
      </div>

      <DemoWindowCard onViewOrders={onViewOrders} />

      {/* side by side, the app's stat size is a little too wide for this window */}
      <div className='grid gap-3 @6xl/app:grid-cols-2 @6xl/app:[&_.tabular-nums]:text-[1.3rem]'>
        <StatGroup title='Revenue' stats={revenueStats} />
        <StatGroup title={`Orders · ${SAMPLE_PERIOD}`} stats={orderStats} />
      </div>

      <DemoRoastCard />

      {full && (
        <>
      <div className='grid gap-3 @6xl/app:grid-cols-2'>
        <WhenVisible fallback={<ChartsSkeleton />}>
          <RevenueTrendChart data={revenueTrend} periodLabel={SAMPLE_PERIOD} />
        </WhenVisible>
        <WhenVisible fallback={<ChartsSkeleton />}>
          <CategoryRevenueChart data={categoryRevenue} periodLabel={SAMPLE_PERIOD} />
        </WhenVisible>
      </div>

      <WhenVisible fallback={<HeatmapSkeleton />}>
        <SampleHeatmap
          title='Organization Activity'
          description='Total spending across the organization over time'
        />
      </WhenVisible>

      <div inert className='grid gap-3 @6xl/app:grid-cols-2'>
        <TopEmployeesCard employees={rankings} />
        <TopWindowWinnersCard winners={windowWinners} />
      </div>

      <div inert className='grid gap-3 @6xl/app:grid-cols-2'>
        <TopSellingItemsCard items={topItems} />
        <RecentWindowsCard windows={recentWindows} />
      </div>
        </>
      )}
    </div>
  );
}
