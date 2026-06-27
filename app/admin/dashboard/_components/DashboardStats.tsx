import { Card } from "@/components/ui/card";

type DashboardStatsProps = {
  stats: {
    totalRevenue: number;
    totalOrders: number;
    approvedOrders: number;
    avgOrderValue: number;
    allTimeRevenue: number;
    todayRevenue: number | null;
  };
  periodLabel: string;
};

export function DashboardStats({ stats, periodLabel }: DashboardStatsProps) {
  const statsConfig = [
    {
      title: "Today's Revenue",
      value: stats.todayRevenue !== null ? `₹${stats.todayRevenue.toFixed(2)}` : "₹0.00",
      color: "from-amber-500 to-amber-600",
      gradient: "via-amber-400",
    },
    {
      title: `${periodLabel} Revenue`,
      value: `₹${stats.totalRevenue.toFixed(2)}`,
      color: "from-emerald-500 to-emerald-600",
      gradient: "via-emerald-400",
    },
    {
      title: "All Time Revenue",
      value: `₹${stats.allTimeRevenue.toFixed(2)}`,
      color: "from-orange-500 to-orange-600",
      gradient: "via-orange-400",
    },

    {
      title: `${periodLabel} Orders`,
      value: stats.totalOrders,
      color: "from-blue-500 to-blue-600",
      gradient: "via-blue-400",
    },
    {
      title: "Approved Orders",
      value: stats.approvedOrders,
      color: "from-green-500 to-green-600",
      gradient: "via-green-400",
    },
    {
      title: "Average Order Value",
      value: `₹${stats.avgOrderValue.toFixed(2)}`,
      color: "from-purple-500 to-purple-600",
      gradient: "via-purple-400",
    },
  ];

  return (
    <div className='grid gap-2 md:grid-cols-2 lg:grid-cols-3'>
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
                  <p className='text-2xl font-bold tracking-tight mt-0.5'>
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
