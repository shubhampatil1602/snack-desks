import { prisma } from "@/lib/db";
import { getEmployeeRankings } from "@/modules/rankings/queries";
import { startOfMonth, startOfDay, endOfDay } from "date-fns";

export async function getDashboardData(organizationId: string, period: string) {
  // Parse period - supports "all", "YYYY", and "YYYY-MM"
  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (period === "all") {
    // No date filters - get all time data
    startDate = undefined;
    endDate = undefined;
  } else if (period.length === 4) {
    // Year view: "2026"
    const year = Number(period);
    startDate = new Date(year, 0, 1);
    endDate = new Date(year, 11, 31, 23, 59, 59);
  } else {
    // Month view: "2026-06"
    const [year, month] = period.split("-");
    startDate = new Date(Number(year), Number(month) - 1, 1);
    endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
  }

  // Build where clause with optional date filter
  const dateFilter =
    startDate && endDate
      ? {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        }
      : {};

  const now = new Date();
  const monthStart = startOfMonth(now);
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);

  const [
    activeWindow,
    allOrders,
    currentMonthOrders,
    recentWindows,
    topSellingRaw,
    rankings,
    statusDistributionRaw,
  ] = await Promise.all([
    prisma.orderWindow.findFirst({
      where: {
        organizationId,
        status: "active",
      },
      select: {
        id: true,
        label: true,
        startsAt: true,
        endsAt: true,
        orders: {
          select: {
            status: true,
          },
        },
      },
    }),

    prisma.order.findMany({
      where: {
        organizationId,
        ...dateFilter,
      },
      include: {
        user: true,
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    }),

    prisma.order.findMany({
      where: {
        organizationId,
        status: "approved",
        createdAt: {
          gte: monthStart,
        },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    }),

    prisma.orderWindow.findMany({
      where: {
        organizationId,
        ...dateFilter,
      },
      include: {
        orders: {
          include: {
            items: {
              include: {
                menuItem: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    }),

    prisma.orderItem.groupBy({
      by: ["menuItemId"],
      where: {
        order: {
          organizationId,
          status: "approved",
          ...dateFilter,
        },
        replacementApplied: false,
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 5,
    }),

    getEmployeeRankings(organizationId, period),

    prisma.order.groupBy({
      by: ["status"],
      where: {
        organizationId,
        ...dateFilter,
      },
      _count: {
        id: true,
      },
    }),
  ]);

  const [menuItems] = await Promise.all([
    prisma.menuItem.findMany({
      where: {
        id: {
          in: topSellingRaw.map((item) => item.menuItemId),
        },
      },
    }),
  ]);

  const menuLookup = new Map(menuItems.map((item) => [item.id, item]));

  // =========================
  // Stats
  // =========================

  const approvedOrders = allOrders.filter(
    (order) => order.status === "approved",
  );

  const totalRevenue = approvedOrders.reduce(
    (sum, order) =>
      sum +
      order.items
        .filter((item) => !item.replacementApplied)
        .reduce(
          (itemSum, item) =>
            itemSum + Number(item.menuItem.price) * item.quantity,
          0,
        ),
    0,
  );

  const avgOrderValue =
    approvedOrders.length === 0 ? 0 : totalRevenue / approvedOrders.length;

  // =========================
  // Top Selling Items
  // =========================

  const topSellingItems = topSellingRaw.map((item) => ({
    menuItemId: item.menuItemId,
    name: menuLookup.get(item.menuItemId)?.name ?? "Unknown",
    quantity: item._sum.quantity ?? 0,
  }));

  // =========================
  // Top Employees
  // =========================

  const topEmployees = rankings.slice(0, 3);

  // =========================
  // Time-based Revenue
  // =========================

  let includesToday = false;
  
  if (period === "all") {
    includesToday = true;
  } else if (period.length === 4) {
    includesToday = Number(period) === now.getFullYear();
  } else if (period.length === 7) {
    const [year, month] = period.split("-");
    includesToday = Number(year) === now.getFullYear() && Number(month) === now.getMonth() + 1;
  }

  const allTimeOrders = await prisma.order.findMany({
    where: {
      organizationId,
      status: "approved",
    },
    select: {
      items: {
        select: {
          quantity: true,
          replacementApplied: true,
          menuItem: {
            select: { price: true },
          },
        },
      },
    },
  });

  const allTimeRevenue = allTimeOrders.reduce(
    (sum, order) =>
      sum +
      order.items
        .filter((item) => !item.replacementApplied)
        .reduce(
          (itemSum, item) =>
            itemSum + Number(item.menuItem.price) * item.quantity,
          0,
        ),
    0,
  );

  const todayRevenue = includesToday ? currentMonthOrders
    .filter((order) => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= dayStart && orderDate <= dayEnd;
    })
    .reduce(
      (sum, order) =>
        sum +
        order.items
          .filter((item) => !item.replacementApplied)
          .reduce(
            (itemSum, item) =>
              itemSum + Number(item.menuItem.price) * item.quantity,
            0,
          ),
      0,
    ) : null;

  const statusDistribution = {
    approved:
      statusDistributionRaw.find((s) => s.status === "approved")?._count.id ??
      0,
    rejected:
      statusDistributionRaw.find((s) => s.status === "rejected")?._count.id ??
      0,
    cancelled:
      statusDistributionRaw.find((s) => s.status === "cancelled")?._count.id ??
      0,
  };

  return {
    activeWindow,
    stats: {
      totalRevenue,
      totalOrders: allOrders.length,
      approvedOrders: approvedOrders.length,
      avgOrderValue,
      allTimeRevenue,
      todayRevenue,
    },
    topSellingItems,
    topEmployees,
    recentWindows: recentWindows.map((window) => {
      const revenue = window.orders
        .filter((order) => order.status === "approved")
        .reduce(
          (sum, order) =>
            sum +
            order.items
              .filter((item) => !item.replacementApplied)
              .reduce(
                (itemSum, item) =>
                  itemSum + Number(item.menuItem.price) * item.quantity,
                0,
              ),
          0,
        );

      return {
        id: window.id,
        label: window.label,
        createdAt: window.createdAt,
        status: window.status,
        ordersCount: window.orders.length,
        revenue,
      };
    }),
    statusDistribution,
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
