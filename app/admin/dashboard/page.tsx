import { requireAdmin } from "@/actions/user";
import { getDashboardData } from "@/modules/admin-dashboard/queries";

import { prisma } from "@/lib/db";
import {
  getPeriodLabel,
  generateMonthsFromDate,
  getActivePeriod,
} from "@/lib/period-utils";
import { PeriodPicker } from "@/components/period-picker";

import { DashboardStats } from "./_components/DashboardStats";
import { ActiveWindowCard } from "./_components/ActiveWindowCard";
import { TopSellingItemsCard } from "./_components/TopSellingItemsCard";
import { TopEmployeesCard } from "./_components/TopEmployeesCard";
import { RecentWindowsCard } from "./_components/RecentWindowsCard";
import { DashboardSSE } from "./_components/DashboardSSE";
import { SnackHeatmap } from "@/components/SnackHeatMap";

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
  const period = getActivePeriod(params.period);

  const dashboardData = await getDashboardData(member.organizationId, period);
  const serverNow = new Date().getTime();

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
          period={params.period}
          startDate={organization.createdAt}
          basePath='/admin/dashboard'
        />
      </div>

      <DashboardSSE />
      <ActiveWindowCard
        window={dashboardData.activeWindow}
        serverNow={serverNow}
      />

      <DashboardStats stats={dashboardData.stats} periodLabel={periodLabel} />
      <div className='grid gap-3 lg:grid-cols-2'>
        <TopSellingItemsCard items={dashboardData.topSellingItems} />
        <TopEmployeesCard employees={dashboardData.topEmployees} />
      </div>
      <SnackHeatmap
        data={dashboardData.heatmapData}
        joinedAt={organization.createdAt}
        title='Organization Activity'
        description='Total spending across the organization over time'
      />

      <RecentWindowsCard windows={dashboardData.recentWindows} />
    </div>
  );
}
