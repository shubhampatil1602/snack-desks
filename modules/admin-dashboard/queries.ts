import { prisma } from "@/lib/db";
import { getEmployeeRankings } from "@/modules/rankings/queries";

export async function getDashboardData(organizationId: string) {
  const [
    activeWindow,
    allOrders,
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

    prisma.orderWindow.findMany({
      where: {
        organizationId,
        // status: "closed",
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
        },
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

    getEmployeeRankings(organizationId),

    prisma.order.groupBy({
      by: ["status"],

      where: {
        organizationId,
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
      order.items.reduce(
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
  // Status Distribution
  // =========================

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
    },

    topSellingItems,

    topEmployees,

    recentWindows: recentWindows.map((window) => {
      const revenue = window.orders
        .filter((order) => order.status === "approved")
        .reduce(
          (sum, order) =>
            sum +
            order.items.reduce(
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
