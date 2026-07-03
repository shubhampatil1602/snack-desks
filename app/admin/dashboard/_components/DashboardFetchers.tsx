import { 
  getDashboardActiveWindow, 
  getDashboardStats, 
  getTopSellingItems, 
  getTopEmployeesData, 
  getRecentWindows, 
  getDashboardHeatmap 
} from "@/modules/admin-dashboard/queries";
import { DashboardStats } from "./DashboardStats";
import { ActiveWindowCard } from "./ActiveWindowCard";
import { TopSellingItemsCard } from "./TopSellingItemsCard";
import { TopEmployeesCard } from "./TopEmployeesCard";
import { RecentWindowsCard } from "./RecentWindowsCard";
import { SnackHeatmap } from "@/components/SnackHeatMap";

export async function ActiveWindowFetcher({ organizationId }: { organizationId: string }) {
  const activeWindow = await getDashboardActiveWindow(organizationId);
  const serverNow = new Date().getTime();
  return <ActiveWindowCard window={activeWindow} serverNow={serverNow} />;
}

export async function DashboardStatsFetcher({ organizationId, period, periodLabel }: { organizationId: string, period: string, periodLabel: string }) {
  const stats = await getDashboardStats(organizationId, period);
  return <DashboardStats stats={stats} periodLabel={periodLabel} />;
}

export async function TopSellingItemsFetcher({ organizationId, period }: { organizationId: string, period: string }) {
  const items = await getTopSellingItems(organizationId, period);
  return <TopSellingItemsCard items={items} />;
}

export async function TopEmployeesFetcher({ organizationId, period }: { organizationId: string, period: string }) {
  const employees = await getTopEmployeesData(organizationId, period);
  return <TopEmployeesCard employees={employees} />;
}

export async function RecentWindowsFetcher({ organizationId, period }: { organizationId: string, period: string }) {
  const windows = await getRecentWindows(organizationId, period);
  return <RecentWindowsCard windows={windows} />;
}

export async function HeatmapFetcher({ organizationId, joinedAt }: { organizationId: string, joinedAt: Date }) {
  const data = await getDashboardHeatmap(organizationId);
  return (
    <SnackHeatmap
      data={data}
      joinedAt={joinedAt}
      title='Organization Activity'
      description='Total spending across the organization over time'
    />
  );
}
