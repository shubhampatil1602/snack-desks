import { requireAdmin } from "@/actions/user";
import { prisma } from "@/lib/db";
import {
  getPeriodLabel,
  generateMonthsFromDate,
  getActivePeriod,
} from "@/lib/period-utils";
import { PeriodPicker } from "@/components/period-picker";
import { getPeriodCookie } from "@/actions/period-cookie";

import { DashboardSSE } from "./_components/DashboardSSE";
import { Suspense } from "react";
import {
  ActiveWindowFetcher,
  DashboardStatsFetcher,
  HeatmapFetcher,
  RecentWindowsFetcher,
  TopEmployeesFetcher,
  TopSellingItemsFetcher,
} from "./_components/DashboardFetchers";
import {
  ActiveWindowSkeleton,
  HeatmapSkeleton,
  RecentWindowsSkeleton,
  StatsSkeleton,
  TopEmployeesSkeleton,
  TopItemsSkeleton,
} from "./_components/DashboardSkeletons";

interface AdminDashboardProps {
  searchParams: Promise<{
    period?: string;
  }>;
}

export default async function AdminDashboard({
  searchParams,
}: AdminDashboardProps) {
  const { member } = await requireAdmin();

  const organization = await prisma.organization.findUnique({
    where: {
      id: member.organizationId,
    },
    select: {
      createdAt: true,
    },
  });

  if (!organization) {
    throw new Error("Organization not found");
  }

  const params = await searchParams;
  const cookiePeriod = await getPeriodCookie();
  const rawPeriod = params.period ?? cookiePeriod ?? undefined;
  const period = getActivePeriod(rawPeriod);

  const months = generateMonthsFromDate(organization.createdAt);
  const periodLabel = getPeriodLabel(period, months);

  return (
    <div className='space-y-3 px-4'>
      <div className='flex items-start justify-between gap-4 flex-wrap'>
        <div className='mb-3'>
          <h1 className='text-2xl font-heading tracking-wide'>
            Hello, {member.user.name}
          </h1>
          <p className='text-sm text-muted-foreground mt-1'>
            Here&apos;s what&apos;s happening across your organization.
          </p>
        </div>

        <PeriodPicker
          period={rawPeriod}
          startDate={organization.createdAt}
          basePath='/admin/dashboard'
        />
      </div>

      <DashboardSSE />
      
      <Suspense fallback={<ActiveWindowSkeleton />}>
        <ActiveWindowFetcher organizationId={member.organizationId} />
      </Suspense>

      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStatsFetcher 
          organizationId={member.organizationId} 
          period={period} 
          periodLabel={periodLabel} 
        />
      </Suspense>

      <div className='grid gap-3 lg:grid-cols-2'>
        <Suspense fallback={<TopItemsSkeleton />}>
          <TopSellingItemsFetcher organizationId={member.organizationId} period={period} />
        </Suspense>
        
        <Suspense fallback={<TopEmployeesSkeleton />}>
          <TopEmployeesFetcher organizationId={member.organizationId} period={period} />
        </Suspense>
      </div>
      
      <Suspense fallback={<HeatmapSkeleton />}>
        <HeatmapFetcher 
          organizationId={member.organizationId} 
          joinedAt={organization.createdAt} 
        />
      </Suspense>

      <Suspense fallback={<RecentWindowsSkeleton />}>
        <RecentWindowsFetcher organizationId={member.organizationId} period={period} />
      </Suspense>
    </div>
  );
}
