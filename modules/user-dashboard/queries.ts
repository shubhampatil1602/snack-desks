import { prisma } from "@/lib/db";

export async function getUserDashboardData(
  organizationId: string,
  userId: string,
) {
  const orders = await prisma.order.findMany({
    where: {
      organizationId,
      userId,
      status: "approved",
    },
    include: {
      orderWindow: true,
      items: {
        include: {
          menuItem: true,
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
      order.items.reduce(
        (itemSum, item) =>
          itemSum + Number(item.menuItem.price) * item.quantity,
        0,
      ),
    0,
  );

  const totalOrders = orders.length;

  const averageOrderValue = totalOrders === 0 ? 0 : totalSpent / totalOrders;

  // =========================
  // Favorite Items
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
  // Recent Orders
  // =========================

  const recentOrders = orders.slice(0, 5).map((order) => {
    const total = order.items.reduce(
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
  // Rankings
  // =========================

  const allApprovedOrders = await prisma.order.findMany({
    where: {
      organizationId,
      status: "approved",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      items: {
        include: {
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
    const total = order.items.reduce(
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

  return {
    stats: {
      totalOrders,
      totalSpent,
      averageOrderValue,
      currentRank: currentUserRank?.rank ?? null,
    },

    rank: currentUserRank,

    recentOrders,

    favoriteItems,
  };
}

export type UserDashboardData = Awaited<
  ReturnType<typeof getUserDashboardData>
>;
