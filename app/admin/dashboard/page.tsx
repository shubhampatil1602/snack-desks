import { requireAdmin } from "@/actions/user";
import { getDashboardData } from "@/modules/admin-dashboard/queries";
import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { PeriodPicker } from "@/components/period-picker";

import { DashboardStats } from "./_components/DashboardStats";
import { ActiveWindowCard } from "./_components/ActiveWindowCard";
import { TopSellingItemsCard } from "./_components/TopSellingItemsCard";
import { TopEmployeesCard } from "./_components/TopEmployeesCard";
import { RecentWindowsCard } from "./_components/RecentWindowsCard";
import { DashboardSSE } from "./_components/DashboardSSE";

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
  const period = params.period ?? format(new Date(), "yyyy-MM");

  const dashboardData = await getDashboardData(member.organizationId, period);
  const serverNow = new Date().getTime();

  return (
    <div className='space-y-6 px-4'>
      <div className='flex items-start justify-between gap-4 flex-wrap'>
        <div>
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

      <DashboardStats stats={dashboardData.stats} />

      <div className='grid gap-3 lg:grid-cols-2'>
        <TopSellingItemsCard items={dashboardData.topSellingItems} />
        <TopEmployeesCard employees={dashboardData.topEmployees} />
      </div>

      <RecentWindowsCard windows={dashboardData.recentWindows} />
    </div>
  );
}
