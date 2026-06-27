import { prisma } from "@/lib/db";
import { startOfMonth, startOfDay, endOfDay } from "date-fns";

export async function getUserDashboardData(
  organizationId: string,
  userId: string,
  period: string, // Can be "all" or "YYYY" or "YYYY-MM"
) {
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

  // =========================
  // User Orders (filtered by period)
  // =========================

  const orders = await prisma.order.findMany({
    where: {
      organizationId,
      userId,
      status: "approved",
      ...dateFilter,
    },
    select: {
      id: true,
      status: true,
      createdAt: true,

      orderWindow: {
        select: {
          label: true,
        },
      },

      items: {
        select: {
          quantity: true,
          menuItemId: true,
          replacementApplied: true,

          menuItem: {
            select: {
              name: true,
              price: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // =========================
  // Stats
  // =========================

  const totalSpent = orders.reduce(
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

  const totalOrders = orders.length;

  const averageOrderValue = totalOrders === 0 ? 0 : totalSpent / totalOrders;

  // =========================
  // Favorite Items (filtered by period)
  // =========================

  const itemMap = new Map<
    string,
    {
      menuItemId: string;
      name: string;
      quantity: number;
    }
  >();

  for (const order of orders) {
    for (const item of order.items) {
      if (item.replacementApplied) continue;
      const existing = itemMap.get(item.menuItemId);

      if (existing) {
        existing.quantity += item.quantity;
      } else {
        itemMap.set(item.menuItemId, {
          menuItemId: item.menuItemId,
          name: item.menuItem.name,
          quantity: item.quantity,
        });
      }
    }
  }

  const favoriteItems = Array.from(itemMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // =========================
  // Recent Orders (filtered by period)
  // =========================

  const recentOrders = orders.slice(0, 5).map((order) => {
    const total = order.items
      .filter((item) => !item.replacementApplied)
      .reduce(
        (sum, item) => sum + Number(item.menuItem.price) * item.quantity,
        0,
      );

    return {
      id: order.id,
      status: order.status,
      createdAt: order.createdAt,
      windowLabel: order.orderWindow.label,
      total,
    };
  });

  // =========================
  // Rankings (filtered by period)
  // =========================

  const allApprovedOrders = await prisma.order.findMany({
    where: {
      organizationId,
      status: "approved",
      ...dateFilter,
    },
    select: {
      userId: true,

      user: {
        select: {
          id: true,
          name: true,
        },
      },

      items: {
        select: {
          quantity: true,
          replacementApplied: true,

          menuItem: {
            select: {
              price: true,
            },
          },
        },
      },
    },
  });

  const rankingsMap = new Map<
    string,
    {
      userId: string;
      name: string;
      spent: number;
      orders: number;
    }
  >();

  for (const order of allApprovedOrders) {
    const total = order.items
      .filter((item) => !item.replacementApplied)
      .reduce(
        (sum, item) => sum + Number(item.menuItem.price) * item.quantity,
        0,
      );

    const existing = rankingsMap.get(order.userId);

    if (existing) {
      existing.spent += total;
      existing.orders += 1;
    } else {
      rankingsMap.set(order.userId, {
        userId: order.user.id,
        name: order.user.name,
        spent: total,
        orders: 1,
      });
    }
  }

  const rankings = Array.from(rankingsMap.values())
    .sort((a, b) => b.spent - a.spent)
    .map((user, index) => ({
      rank: index + 1,
      ...user,
    }));

  const currentUserRank =
    rankings.find((user) => user.userId === userId) ?? null;

  // =========================
  // Time-based Spent
  // =========================

  const now = new Date();
  const monthStart = startOfMonth(now);
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);

  const currentMonthOrders = await prisma.order.findMany({
    where: {
      organizationId,
      userId,
      status: "approved",
      createdAt: {
        gte: monthStart,
      },
    },
    select: {
      createdAt: true,
      items: {
        select: {
          quantity: true,
          replacementApplied: true,
          menuItem: {
            select: {
              price: true,
            },
          },
        },
      },
    },
  });

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
      userId,
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

  const allTimeSpent = allTimeOrders.reduce(
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

  const todaySpent = includesToday ? currentMonthOrders
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

  // =========================
  // Return
  // =========================

  return {
    stats: {
      totalOrders,
      totalSpent,
      averageOrderValue,
      currentRank: currentUserRank?.rank ?? null,
      allTimeSpent,
      todaySpent,
    },

    rank: currentUserRank,

    recentOrders,

    favoriteItems,
  };
}

export type UserDashboardData = Awaited<
  ReturnType<typeof getUserDashboardData>
>;
