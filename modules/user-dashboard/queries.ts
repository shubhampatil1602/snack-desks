import { prisma } from "@/lib/db";
import {
  parsePeriod,
  getISTDateParts,
  getISTDayBoundaries,
} from "@/lib/date-utils";
import { getHeatmapData } from "@/lib/get-heatmap-data";
import { getEmployeeRankings } from "@/modules/rankings/queries";

function getDateFilter(period: string) {
  const { startDate, endDate } = parsePeriod(period);
  return startDate && endDate
    ? {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      }
    : {};
}

export async function getUserStats(
  organizationId: string,
  userId: string,
  period: string,
) {
  const dateFilter = getDateFilter(period);

  const orders = await prisma.order.findMany({
    where: {
      organizationId,
      userId,
      status: "approved",
      ...dateFilter,
    },
    select: {
      items: {
        where: { replacementApplied: false },
        select: {
          quantity: true,
          menuItem: {
            select: { price: true, shop: { select: { name: true } } },
          },
        },
      },
    },
  });

  let totalSpent = 0;
  const totalSpentShopBreakdown: Record<string, number> = {};
  orders.forEach((order) => {
    order.items.forEach((item) => {
      const amt = Number(item.menuItem.price) * item.quantity;
      const shopName = item.menuItem.shop?.name || "Unknown Shop";
      totalSpent += amt;
      totalSpentShopBreakdown[shopName] =
        (totalSpentShopBreakdown[shopName] || 0) + amt;
    });
  });

  const totalOrders = orders.length;
  const averageOrderValue = totalOrders === 0 ? 0 : totalSpent / totalOrders;

  // Rank
  const rankings = await getEmployeeRankings(organizationId, period);
  const currentUserRank = rankings.find((r) => r.userId === userId) ?? null;

  // Time-based spent
  const { dayStart, dayEnd } = getISTDayBoundaries();
  let includesToday = false;
  const { year: currentYear, month: currentMonth } = getISTDateParts();

  if (period === "all") {
    includesToday = true;
  } else if (period.length === 4) {
    includesToday = Number(period) === currentYear;
  } else if (period.length === 7) {
    const [year, month] = period.split("-");
    includesToday =
      Number(year) === currentYear && Number(month) === currentMonth + 1;
  }

  const allTimeOrders = await prisma.order.findMany({
    where: {
      organizationId,
      userId,
      status: "approved",
    },
    select: {
      items: {
        where: { replacementApplied: false },
        select: {
          quantity: true,
          menuItem: {
            select: { price: true, shop: { select: { name: true } } },
          },
        },
      },
    },
  });

  let allTimeSpent = 0;
  const allTimeSpentShopBreakdown: Record<string, number> = {};
  allTimeOrders.forEach((order) => {
    order.items.forEach((item) => {
      const amt = Number(item.menuItem.price) * item.quantity;
      const shopName = item.menuItem.shop?.name || "Unknown Shop";
      allTimeSpent += amt;
      allTimeSpentShopBreakdown[shopName] =
        (allTimeSpentShopBreakdown[shopName] || 0) + amt;
    });
  });

  let todaySpent: number | null = null;
  const todaySpentShopBreakdown: Record<string, number> = {};
  if (includesToday) {
    const todayOrders = await prisma.order.findMany({
      where: {
        organizationId,
        userId,
        status: "approved",
        createdAt: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
      select: {
        items: {
          where: { replacementApplied: false },
          select: {
            quantity: true,
            menuItem: {
              select: { price: true, shop: { select: { name: true } } },
            },
          },
        },
      },
    });

    todaySpent = 0;
    todayOrders.forEach((order) => {
      order.items.forEach((item) => {
        const amt = Number(item.menuItem.price) * item.quantity;
        const shopName = item.menuItem.shop?.name || "Unknown Shop";
        todaySpent! += amt;
        todaySpentShopBreakdown[shopName] =
          (todaySpentShopBreakdown[shopName] || 0) + amt;
      });
    });
  }

  return {
    totalOrders,
    totalSpent,
    totalSpentShopBreakdown,
    averageOrderValue,
    currentRank: currentUserRank,
    allTimeSpent,
    allTimeSpentShopBreakdown,
    todaySpent,
    todaySpentShopBreakdown,
  };
}

export async function getUserFavoriteItems(
  organizationId: string,
  userId: string,
  period: string,
) {
  const dateFilter = getDateFilter(period);

  const items = await prisma.orderItem.groupBy({
    by: ["menuItemId"],
    where: {
      order: { organizationId, userId, status: "approved", ...dateFilter },
      replacementApplied: false,
    },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 5,
  });

  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: items.map((i) => i.menuItemId) } },
    select: { id: true, name: true },
  });

  const menuLookup = new Map(menuItems.map((m) => [m.id, m.name]));

  return items.map((item) => ({
    menuItemId: item.menuItemId,
    name: menuLookup.get(item.menuItemId) ?? "Unknown",
    quantity: item._sum.quantity ?? 0,
  }));
}

export async function getUserRecentOrders(
  organizationId: string,
  userId: string,
  period: string,
) {
  const dateFilter = getDateFilter(period);

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
      orderWindow: { select: { label: true } },
      items: {
        where: { replacementApplied: false },
        select: {
          quantity: true,
          menuItem: { select: { price: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return orders.map((order) => ({
    id: order.id,
    status: order.status,
    createdAt: order.createdAt,
    windowLabel: order.orderWindow.label,
    total: order.items.reduce(
      (sum, item) => sum + Number(item.menuItem.price) * item.quantity,
      0,
    ),
  }));
}

export async function getUserHeatmapData(
  organizationId: string,
  userId: string,
) {
  const allTimeOrders = await prisma.order.findMany({
    where: {
      organizationId,
      userId,
      status: "approved",
    },
    select: {
      createdAt: true,
      items: {
        where: { replacementApplied: false },
        select: {
          quantity: true,
          menuItem: { select: { price: true } },
        },
      },
    },
  });

  return getHeatmapData(allTimeOrders as any);
}

export async function getUserSplitMasterWins(
  organizationId: string,
  userId: string,
) {
  return prisma.orderWindow.count({
    where: {
      organizationId,
      winnerUserId: userId,
    },
  });
}
