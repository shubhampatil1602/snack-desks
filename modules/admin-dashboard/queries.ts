import { prisma } from "@/lib/db";

export async function getDashboardData(organizationId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    activeWindow,
    todaysOrders,
    recentWindows,
    topSellingRaw,
    topEmployeesRaw,
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
        createdAt: {
          gte: today,
        },
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

    prisma.order.groupBy({
      by: ["userId"],

      where: {
        organizationId,
        status: "approved",
      },

      _count: {
        id: true,
      },

      orderBy: {
        _count: {
          id: "desc",
        },
      },

      take: 5,
    }),

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

  const [menuItems, users] = await Promise.all([
    prisma.menuItem.findMany({
      where: {
        id: {
          in: topSellingRaw.map((item) => item.menuItemId),
        },
      },
    }),

    prisma.user.findMany({
      where: {
        id: {
          in: topEmployeesRaw.map((employee) => employee.userId),
        },
      },
    }),
  ]);

  const menuLookup = new Map(menuItems.map((item) => [item.id, item]));

  const userLookup = new Map(users.map((user) => [user.id, user]));

  // =========================
  // Stats
  // =========================

  const approvedOrdersToday = todaysOrders.filter(
    (order) => order.status === "approved",
  );

  const revenueToday = approvedOrdersToday.reduce(
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
    approvedOrdersToday.length === 0
      ? 0
      : revenueToday / approvedOrdersToday.length;

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

  const topEmployees = topEmployeesRaw.map((employee) => ({
    userId: employee.userId,
    name: userLookup.get(employee.userId)?.name ?? "Unknown",
    orders: employee._count.id,
  }));

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
      revenueToday,
      ordersToday: todaysOrders.length,
      approvedToday: approvedOrdersToday.length,
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
