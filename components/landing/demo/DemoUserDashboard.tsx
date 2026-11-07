"use client";

import { Calendar, ChevronDown } from "lucide-react";

import {
  ChartsSkeleton,
  HeatmapSkeleton,
} from "@/app/admin/dashboard/_components/DashboardSkeletons";
import { FavoriteItemsCard } from "@/app/(user)/dashboard/_components/FavoriteItemsCard";
import { ProfileHeader } from "@/app/(user)/dashboard/_components/ProfileHeader";
import { RecentOrdersCard } from "@/app/(user)/dashboard/_components/RecentOrdersCard";
import { UserRankCard } from "@/app/(user)/dashboard/_components/UserRankCard";
import { StatGroup } from "@/components/dashboard/StatGroup";
import { CategoryRevenueChart, RevenueTrendChart, SampleHeatmap } from "./demo-charts";
import { DemoRoastCard } from "./DemoRoastCard";
import { WhenVisible } from "./WhenVisible";
import {
  rankings,
  SAMPLE_PERIOD,
  userAwards,
  userCategorySpend,
  userFavouriteItems,
  userMember,
  userOrderStats,
  userProfile,
  userRecentOrders,
  userRoastFooter,
  userRoasts,
  userSpendTrend,
  userSpentStats,
  userSplitMasterWins,
  USER_ID,
} from "./sample-data";

const userRank = rankings.find((row) => row.userId === USER_ID) ?? null;

// The real employee dashboard's cards with sample data, in the same order.
// Until `full`, it stops after the roast, so the charts load only on request.
export function DemoUserDashboard({ full }: { full: boolean }) {
  return (
    <div className='space-y-3 p-4'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='mb-1'>
          <p className='font-heading text-2xl tracking-wide'>Dashboard</p>
          <p className='mt-1 text-sm text-muted-foreground'>Your personal activity and statistics</p>
        </div>
        <div className='flex h-10 min-w-[150px] items-center justify-between gap-2 border px-3 text-sm'>
          <Calendar className='h-4 w-4 text-muted-foreground' />
          <span className='truncate font-medium'>{SAMPLE_PERIOD}</span>
          <ChevronDown className='h-4 w-4 text-muted-foreground' />
        </div>
      </div>

      <ProfileHeader user={userProfile} member={userMember} splitMasterWins={userSplitMasterWins} />

      <div className='grid gap-3 @6xl/app:grid-cols-2 @6xl/app:[&_.tabular-nums]:text-[1.3rem]'>
        <StatGroup title='Spent' stats={userSpentStats} />
        <StatGroup title={`Orders · ${SAMPLE_PERIOD}`} stats={userOrderStats} />
      </div>

      <DemoRoastCard roasts={userRoasts} awards={userAwards} footer={userRoastFooter} />

      {full && (
        <>
          <div className='grid gap-3 @6xl/app:grid-cols-2'>
            <WhenVisible fallback={<ChartsSkeleton />}>
              <RevenueTrendChart
                data={userSpendTrend}
                periodLabel={SAMPLE_PERIOD}
                title='Spending trend'
                description={`Your approved order spend and volume · ${SAMPLE_PERIOD}`}
                valueLabel='Spent'
              />
            </WhenVisible>
            <WhenVisible fallback={<ChartsSkeleton />}>
              <CategoryRevenueChart
                data={userCategorySpend}
                periodLabel={SAMPLE_PERIOD}
                title='Spending by category'
                description={`Your share of approved spend · ${SAMPLE_PERIOD}`}
              />
            </WhenVisible>
          </div>

          <WhenVisible fallback={<HeatmapSkeleton />}>
            <SampleHeatmap />
          </WhenVisible>

          <div inert className='grid gap-3 @6xl/app:grid-cols-2'>
            <UserRankCard rank={userRank} />
            <RecentOrdersCard orders={userRecentOrders} />
          </div>

          <FavoriteItemsCard items={userFavouriteItems} />
        </>
      )}
    </div>
  );
}
