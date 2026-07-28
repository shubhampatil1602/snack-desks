import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { ShopBreakdownInfo } from "@/components/orders/ShopBreakdownInfo";

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
  const statsConfig = [
    {
      title: "Today's Revenue",
      value:
        stats.todayRevenue !== null
          ? `${formatCurrency(stats.todayRevenue)}`
          : formatCurrency(0),
      color: "from-chart-1 to-chart-1/80",
      gradient: "via-chart-1/50",
      breakdown: stats.todayRevenueShopBreakdown,
    },
    {
      title: `${periodLabel} Revenue`,
      value: `${formatCurrency(stats.totalRevenue)}`,
      color: "from-chart-2 to-chart-2/80",
      gradient: "via-chart-2/50",
      breakdown: stats.totalRevenueShopBreakdown,
    },
    {
      title: "All Time Revenue",
      value: `${formatCurrency(stats.allTimeRevenue)}`,
      color: "from-chart-3 to-chart-3/80",
      gradient: "via-chart-3/50",
      breakdown: stats.allTimeRevenueShopBreakdown,
    },

    {
      title: `${periodLabel} Orders`,
      value: stats.totalOrders,
      color: "from-chart-4 to-chart-4/80",
      gradient: "via-chart-4/50",
    },
    {
      title: "Approved Orders",
      value: stats.approvedOrders,
      color: "from-chart-5 to-chart-5/80",
      gradient: "via-chart-5/50",
    },
    {
      title: "Average Order Value",
      value: `${formatCurrency(stats.avgOrderValue)}`,
      color: "from-primary to-primary/80",
      gradient: "via-primary/50",
    },
  ];

  return (
    <div className='grid gap-3 md:grid-cols-2 lg:grid-cols-3'>
      {statsConfig.map((stat, idx) => {
        return (
          <Card
            key={idx}
            className='group relative overflow-hidden transition-all duration-300 hover:shadow-md py-3 px-3'
          >
            {/* Shimmer effect */}
            <div className='absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out'>
              <div
                className={`absolute inset-0 bg-linear-to-r ${stat.color} opacity-20 w-full h-full blur-3xl`}
              />
            </div>

            <div className='p-2.5'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-muted-foreground'>{stat.title}</p>
                  <div className='flex items-center gap-1.5 mt-0.5'>
                    <p className='text-2xl font-bold tracking-tight'>
                      {stat.value}
                    </p>
                    {stat.breakdown && Object.keys(stat.breakdown).length > 0 && (
                      <ShopBreakdownInfo breakdown={stat.breakdown} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
