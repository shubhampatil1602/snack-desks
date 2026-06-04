import { requireAdmin } from "@/actions/user";
import { getDashboardData } from "@/modules/admin-dashboard/queries";

import { DashboardStats } from "./_components/DashboardStats";
import { ActiveWindowCard } from "./_components/ActiveWindowCard";
import { TopSellingItemsCard } from "./_components/TopSellingItemsCard";
import { TopEmployeesCard } from "./_components/TopEmployeesCard";
import { RecentWindowsCard } from "./_components/RecentWindowsCard";
import { DashboardSSE } from "./_components/DashboardSSE";

export default async function AdminDashboard() {
  console.time("AdminDashboard");
  const { member } = await requireAdmin();

  const dashboardData = await getDashboardData(member.organizationId);

  console.timeEnd("AdminDashboard");

  return (
    <div className='space-y-6 px-4'>
      <div>
        <h1 className='text-2xl font-heading tracking-wide'>
          {" "}
          Hello, {member.user.name}{" "}
        </h1>{" "}
        <p className='text-sm text-muted-foreground mt-1'>
          {" "}
          Here&apos;s what&apos;s happening across your organization.{" "}
        </p>
      </div>
      <DashboardSSE />
      <ActiveWindowCard window={dashboardData.activeWindow} />

      <DashboardStats stats={dashboardData.stats} />

      <div className='grid gap-3 lg:grid-cols-2'>
        <TopSellingItemsCard items={dashboardData.topSellingItems} />
        <TopEmployeesCard employees={dashboardData.topEmployees} />
      </div>

      <RecentWindowsCard windows={dashboardData.recentWindows} />
    </div>
  );
}
