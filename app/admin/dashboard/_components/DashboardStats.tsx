import { formatCurrency } from "@/lib/utils";
import { StatGroup, type Stat } from "@/components/dashboard/StatGroup";

type DashboardStatsProps = {
  stats: {
    totalRevenue: number;
    totalRevenueShopBreakdown: Record<string, number>;
    totalOrders: number;
    approvedOrders: number;
    avgOrderValue: number;
    allTimeRevenue: number;
    allTimeRevenueShopBreakdown: Record<string, number>;
    todayRevenue: number | null;
    todayRevenueShopBreakdown: Record<string, number>;
  };
  periodLabel: string;
};

export function DashboardStats({ stats, periodLabel }: DashboardStatsProps) {
  const todayRevenue = stats.todayRevenue ?? 0;
  const approvedShare =
    stats.totalOrders === 0
      ? 0
      : Math.round((stats.approvedOrders / stats.totalOrders) * 100);

  const revenue: Stat[] = [
    {
      label: "Today",
      value: formatCurrency(todayRevenue),
      note: "approved today",
      breakdown: stats.todayRevenueShopBreakdown,
      dim: todayRevenue === 0,
    },
    {
      label: periodLabel,
      value: formatCurrency(stats.totalRevenue),
      note: "approved orders",
      breakdown: stats.totalRevenueShopBreakdown,
    },
    {
      label: "All time",
      value: formatCurrency(stats.allTimeRevenue),
      note: "every approved order",
      breakdown: stats.allTimeRevenueShopBreakdown,
    },
  ];

  const orders: Stat[] = [
    {
      label: "Placed",
      value: stats.totalOrders.toLocaleString("en-IN"),
      note: "all orders",
    },
    {
      label: "Approved",
      value: stats.approvedOrders.toLocaleString("en-IN"),
      note: `${approvedShare}% of placed`,
    },
    {
      label: "Average order",
      value: formatCurrency(stats.avgOrderValue),
      note: "per approved order",
    },
  ];

  return (
    <div className='grid gap-3 lg:grid-cols-2'>
      <StatGroup title='Revenue' stats={revenue} />
      <StatGroup title={`Orders · ${periodLabel}`} stats={orders} />
    </div>
  );
}
