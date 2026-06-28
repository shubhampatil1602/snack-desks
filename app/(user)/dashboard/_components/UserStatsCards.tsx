import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

type UserStatsCardsProps = {
  stats: {
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    currentRank: number | null;
    allTimeSpent: number;
    todaySpent: number | null;
  };
  periodLabel: string;
};

export function UserStatsCards({ stats, periodLabel }: UserStatsCardsProps) {
  const statsConfig = [
    {
      title: "Today's Spent",
      value:
        stats.todaySpent !== null ? `${formatCurrency(stats.todaySpent)}` : formatCurrency(0),
      color: "from-amber-500 to-amber-600",
    },

    {
      title: `${periodLabel} Spent`,
      value: `${formatCurrency(stats.totalSpent)}`,
      color: "from-chart-2 to-chart-2/80",
    },
    {
      title: "All Time Spent",
      value: `${formatCurrency(stats.allTimeSpent)}`,
      color: "from-orange-500 to-orange-600",
    },
    {
      title: `${periodLabel} Orders`,
      value: stats.totalOrders,
      color: "from-chart-1 to-chart-1/80",
    },
    {
      title: "Average Order Value",
      value: `${formatCurrency(stats.averageOrderValue)}`,
      color: "from-chart-3 to-chart-3/80",
    },
    {
      title: "Current Rank In Your Org.",
      value: stats.currentRank ? `#${stats.currentRank}` : "-",
      color: "from-destructive to-destructive/80",
    },
  ];

  return (
    <div className='grid gap-3 md:grid-cols-2 lg:grid-cols-3'>
      {statsConfig.map((stat, idx) => (
        <Card
          key={idx}
          className='group relative overflow-hidden transition-all duration-300 hover:shadow-md py-3 px-3'
        >
          <div className='absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out'>
            <div
              className={`absolute inset-0 bg-linear-to-r ${stat.color} opacity-20 w-full h-full blur-3xl`}
            />
          </div>

          <div className='p-2.5'>
            <div>
              <p className='text-sm text-muted-foreground'>{stat.title}</p>

              <p className='text-2xl font-bold tracking-tight mt-0.5'>
                {stat.value}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
