import { formatCurrency } from "@/lib/utils";
import { StatGroup, type Stat } from "@/components/dashboard/StatGroup";

type UserStatsCardsProps = {
  stats: {
    totalOrders: number;
    totalSpent: number;
    totalSpentShopBreakdown: Record<string, number>;
    averageOrderValue: number;
    currentRank: { rank: number } | null;
    allTimeSpent: number;
    allTimeSpentShopBreakdown: Record<string, number>;
    todaySpent: number | null;
    todaySpentShopBreakdown: Record<string, number>;
  };
  periodLabel: string;
};

export function UserStatsCards({ stats, periodLabel }: UserStatsCardsProps) {
  const todaySpent = stats.todaySpent ?? 0;

  const spent: Stat[] = [
    {
      label: "Today",
      value: formatCurrency(todaySpent),
      note: "approved today",
      breakdown: stats.todaySpentShopBreakdown,
      dim: todaySpent === 0,
    },
    {
      label: periodLabel,
      value: formatCurrency(stats.totalSpent),
      note: "your share, approved",
      breakdown: stats.totalSpentShopBreakdown,
    },
    {
      label: "All time",
      value: formatCurrency(stats.allTimeSpent),
      note: "every approved order",
      breakdown: stats.allTimeSpentShopBreakdown,
    },
  ];

  const orders: Stat[] = [
    {
      label: "Orders",
      value: stats.totalOrders.toLocaleString("en-IN"),
      note: "approved",
    },
    {
      label: "Average order",
      value: formatCurrency(stats.averageOrderValue),
      note: "per approved order",
    },
    {
      label: "Rank",
      value: stats.currentRank ? `#${stats.currentRank.rank}` : "—",
      note: "in your organization",
      dim: !stats.currentRank,
    },
  ];

  return (
    <div className='grid gap-3 lg:grid-cols-2'>
      <StatGroup title='Spent' stats={spent} />
      <StatGroup title={`Orders · ${periodLabel}`} stats={orders} />
    </div>
  );
}
