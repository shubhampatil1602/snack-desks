import { prisma } from "@/lib/db";
import { getEmployeeRankings } from "@/modules/rankings/queries";
import {
  parsePeriod,
  getISTDateParts,
  getISTDayBoundaries,
} from "@/lib/date-utils";
import { format, subYears, addDays } from "date-fns";

export function getDateFilter(period: string) {
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

export async function getDashboardActiveWindow(organizationId: string) {
  return prisma.orderWindow.findFirst({
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
  });
}

export async function getDashboardStats(organizationId: string, period: string) {
  const dateFilter = getDateFilter(period);
  const { dayStart, dayEnd } = getISTDayBoundaries();

  const [allOrdersCount, approvedOrdersCount, rawAllTime, currentMonthRaw] =
    await Promise.all([
      prisma.order.count({
        where: { organizationId, ...dateFilter },
      }),
      prisma.order.count({
        where: { organizationId, status: "approved", ...dateFilter },
      }),

      // Total Revenue for Period
      prisma.orderItem.groupBy({
        by: ["menuItemId"],
        where: {
          order: { organizationId, status: "approved", ...dateFilter },
          replacementApplied: false,
        },
        _sum: { quantity: true },
      }),

      // Today Revenue (if applicable)
      prisma.orderItem.groupBy({
        by: ["menuItemId"],
        where: {
          order: {
            organizationId,
            status: "approved",
            createdAt: { gte: dayStart, lte: dayEnd },
          },
          replacementApplied: false,
        },
        _sum: { quantity: true },
      }),
    ]);

  // We still need all-time revenue (unfiltered by period)
  const allTimeRaw = await prisma.orderItem.groupBy({
    by: ["menuItemId"],
    where: {
      order: { organizationId, status: "approved" },
      replacementApplied: false,
    },
    _sum: { quantity: true },
  });

  // Get all unique menu items involved to fetch prices and shop names once
  const menuItemIds = new Set([
    ...rawAllTime.map((i) => i.menuItemId),
    ...currentMonthRaw.map((i) => i.menuItemId),
    ...allTimeRaw.map((i) => i.menuItemId),
  ]);

  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: Array.from(menuItemIds) } },
    select: { id: true, price: true, shop: { select: { name: true } } },
  });
  
  const menuLookup = new Map(menuItems.map((m) => [m.id, { price: Number(m.price), shopName: m.shop?.name || "Unknown Shop" }]));

  let totalRevenue = 0;
  const totalRevenueShopBreakdown: Record<string, number> = {};
  rawAllTime.forEach((item) => {
    const qty = item._sum.quantity ?? 0;
    const menuInfo = menuLookup.get(item.menuItemId) ?? { price: 0, shopName: "Unknown Shop" };
    const amt = qty * menuInfo.price;
    totalRevenue += amt;
    totalRevenueShopBreakdown[menuInfo.shopName] = (totalRevenueShopBreakdown[menuInfo.shopName] || 0) + amt;
  });
  
  let allTimeRevenue = 0;
  const allTimeRevenueShopBreakdown: Record<string, number> = {};
  allTimeRaw.forEach((item) => {
    const qty = item._sum.quantity ?? 0;
    const menuInfo = menuLookup.get(item.menuItemId) ?? { price: 0, shopName: "Unknown Shop" };
    const amt = qty * menuInfo.price;
    allTimeRevenue += amt;
    allTimeRevenueShopBreakdown[menuInfo.shopName] = (allTimeRevenueShopBreakdown[menuInfo.shopName] || 0) + amt;
  });

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

  let todayRevenue: number | null = null;
  const todayRevenueShopBreakdown: Record<string, number> = {};
  if (includesToday) {
    todayRevenue = 0;
    currentMonthRaw.forEach((item) => {
      const qty = item._sum.quantity ?? 0;
      const menuInfo = menuLookup.get(item.menuItemId) ?? { price: 0, shopName: "Unknown Shop" };
      const amt = qty * menuInfo.price;
      todayRevenue! += amt;
      todayRevenueShopBreakdown[menuInfo.shopName] = (todayRevenueShopBreakdown[menuInfo.shopName] || 0) + amt;
    });
  }

  const avgOrderValue =
    approvedOrdersCount === 0 ? 0 : totalRevenue / approvedOrdersCount;

  return {
    totalRevenue,
    totalRevenueShopBreakdown,
    totalOrders: allOrdersCount,
    approvedOrders: approvedOrdersCount,
    avgOrderValue,
    allTimeRevenue,
    allTimeRevenueShopBreakdown,
    todayRevenue,
    todayRevenueShopBreakdown,
  };
}

export type RevenueTimeSeriesPoint = {
  label: string;
  revenue: number;
  orders: number;
};

function getPeriodRange(period: string) {
  if (period === "all") {
    const rangeEnd = new Date();
    return { rangeStart: subYears(rangeEnd, 1), rangeEnd };
  }
  const { startDate, endDate } = parsePeriod(period);
  return { rangeStart: startDate!, rangeEnd: endDate! };
}

export async function getRevenueTimeSeries(
  organizationId: string,
  period: string,
): Promise<RevenueTimeSeriesPoint[]> {
  const { rangeStart, rangeEnd } = getPeriodRange(period);
  const trunc = period.length === 7 ? "day" : "month";

  const rows = await prisma.$queryRaw<
    { bucket: Date; revenue: number; orders: bigint }[]
  >`
    SELECT
      DATE_TRUNC(${trunc}, o."createdAt" AT TIME ZONE 'Asia/Kolkata') AS bucket,
      COALESCE(SUM(oi.quantity * m.price), 0)::float AS revenue,
      COUNT(DISTINCT o.id)::bigint AS orders
    FROM "order" o
    INNER JOIN "order_item" oi ON o.id = oi."orderId"
    INNER JOIN "menu_item" m ON oi."menuItemId" = m.id
    WHERE o."organizationId" = ${organizationId}
      AND o.status = 'approved'
      AND oi."replacementApplied" = false
      AND o."createdAt" >= ${rangeStart}
      AND o."createdAt" <= ${rangeEnd}
    GROUP BY 1
    ORDER BY 1 ASC
  `;

  const labelFormat =
    trunc === "day"
      ? (d: Date) => format(d, "d MMM")
      : (d: Date) => format(d, "MMM yyyy");

  return rows.map((row) => ({
    label: labelFormat(row.bucket),
    revenue: Number(row.revenue),
    orders: Number(row.orders),
  }));
}

export type CategoryRevenueSlice = {
  category: string;
  revenue: number;
  share: number;
};

export async function getRevenueByCategory(
  organizationId: string,
  period: string,
): Promise<CategoryRevenueSlice[]> {
  const { rangeStart, rangeEnd } =
    period === "all"
      ? { rangeStart: new Date(0), rangeEnd: new Date() }
      : getPeriodRange(period);

  const rows = await prisma.$queryRaw<{ category: string; revenue: number }[]>`
    SELECT
      mc.name AS category,
      COALESCE(SUM(oi.quantity * m.price), 0)::float AS revenue
    FROM "order" o
    INNER JOIN "order_item" oi ON o.id = oi."orderId"
    INNER JOIN "menu_item" m ON oi."menuItemId" = m.id
    INNER JOIN "menu_category" mc ON m."menuCategoryId" = mc.id
    WHERE o."organizationId" = ${organizationId}
      AND o.status = 'approved'
      AND oi."replacementApplied" = false
      AND o."createdAt" >= ${rangeStart}
      AND o."createdAt" <= ${rangeEnd}
    GROUP BY mc.name
    ORDER BY revenue DESC
  `;

  const total = rows.reduce((sum, row) => sum + Number(row.revenue), 0);
  if (total === 0) return [];

  return rows.map((row) => ({
    category: row.category,
    revenue: Number(row.revenue),
    share: Math.round((Number(row.revenue) / total) * 100),
  }));
}

export async function getTopWindowWinners(
  organizationId: string,
  period: string,
) {
  const dateFilter = getDateFilter(period);

  const grouped = await prisma.orderWindow.groupBy({
    by: ["winnerUserId"],
    where: {
      organizationId,
      winnerUserId: { not: null },
      ...dateFilter,
    },
    _count: { _all: true },
    orderBy: { _count: { winnerUserId: "desc" } },
    take: 5,
  });

  const userIds = grouped
    .map((row) => row.winnerUserId)
    .filter((id): id is string => id !== null);

  if (userIds.length === 0) return [];

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true },
  });
  const nameById = new Map(users.map((user) => [user.id, user.name]));

  return grouped.map((row, index) => ({
    userId: row.winnerUserId!,
    name: nameById.get(row.winnerUserId!) ?? "Unknown",
    wins: row._count._all,
    rank: index + 1,
  }));
}

export async function getTopSellingItems(
  organizationId: string,
  period: string
) {
  const dateFilter = getDateFilter(period);

  const topSellingRaw = await prisma.orderItem.groupBy({
    by: ["menuItemId"],
    where: {
      order: { organizationId, status: "approved", ...dateFilter },
      replacementApplied: false,
    },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 5,
  });

  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: topSellingRaw.map((item) => item.menuItemId) } },
  });

  const menuLookup = new Map(menuItems.map((item) => [item.id, item]));

  return topSellingRaw.map((item) => ({
    menuItemId: item.menuItemId,
    name: menuLookup.get(item.menuItemId)?.name ?? "Unknown",
    quantity: item._sum.quantity ?? 0,
  }));
}

export async function getTopEmployeesData(
  organizationId: string,
  period: string
) {
  const rankings = await getEmployeeRankings(organizationId, period);
  return rankings.slice(0, 3);
}

export async function getRecentWindows(
  organizationId: string,
  period: string
) {
  const dateFilter = getDateFilter(period);
  const recentWindows = await prisma.orderWindow.findMany({
    where: { organizationId, status: { not: "active" }, ...dateFilter },
    include: {
      orders: {
        where: { status: "approved" },
        select: {
          items: {
            where: { replacementApplied: false },
            select: { quantity: true, menuItem: { select: { price: true } } },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  return recentWindows.map((window) => {
    const revenue = window.orders.reduce((sum, order) => {
      return (
        sum +
        order.items.reduce(
          (itemSum, item) =>
            itemSum + Number(item.menuItem.price) * item.quantity,
          0
        )
      );
    }, 0);

    return {
      id: window.id,
      label: window.label,
      createdAt: window.createdAt,
      status: window.status,
      ordersCount: window.orders.length,
      revenue,
    };
  });
}

export async function getDashboardHeatmap(organizationId: string) {
  const endDate = new Date();
  const startDate = subYears(endDate, 1);

  // Raw query for massive performance gain. Exactly mimics previous logic.
  const rawData = await prisma.$queryRaw<{ date: Date; spent: number }[]>`
    SELECT 
      DATE_TRUNC('day', o."createdAt") as "date",
      SUM(oi.quantity * m.price) as "spent"
    FROM "order" o
    JOIN "order_item" oi ON o.id = oi."orderId"
    JOIN "menu_item" m ON oi."menuItemId" = m.id
    WHERE o."organizationId" = ${organizationId}
      AND o.status = 'approved'
      AND oi."replacementApplied" = false
      AND o."createdAt" >= ${startDate}
    GROUP BY DATE_TRUNC('day', o."createdAt")
  `;

  const orderMap = new Map<string, number>();
  for (const row of rawData) {
    if (row.date) {
      orderMap.set(format(row.date, "yyyy-MM-dd"), Number(row.spent));
    }
  }

  const data = [];
  for (let date = startDate; date <= endDate; date = addDays(date, 1)) {
    const key = format(date, "yyyy-MM-dd");
    data.push({ date: key, spent: orderMap.get(key) ?? 0 });
  }
  return data;
}
