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

  // Get all unique menu items involved to fetch prices once
  const menuItemIds = new Set([
    ...rawAllTime.map((i) => i.menuItemId),
    ...currentMonthRaw.map((i) => i.menuItemId),
    ...allTimeRaw.map((i) => i.menuItemId),
  ]);

  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: Array.from(menuItemIds) } },
    select: { id: true, price: true },
  });
  
  const menuLookup = new Map(menuItems.map((m) => [m.id, Number(m.price)]));

  const totalRevenue = rawAllTime.reduce(
    (sum, item) =>
      sum + (item._sum.quantity ?? 0) * (menuLookup.get(item.menuItemId) ?? 0),
    0
  );
  
  const allTimeRevenue = allTimeRaw.reduce(
    (sum, item) =>
      sum + (item._sum.quantity ?? 0) * (menuLookup.get(item.menuItemId) ?? 0),
    0
  );

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

  const todayRevenue = includesToday
    ? currentMonthRaw.reduce(
        (sum, item) =>
          sum +
          (item._sum.quantity ?? 0) * (menuLookup.get(item.menuItemId) ?? 0),
        0
      )
    : null;

  const avgOrderValue =
    approvedOrdersCount === 0 ? 0 : totalRevenue / approvedOrdersCount;

  return {
    totalRevenue,
    totalOrders: allOrdersCount,
    approvedOrders: approvedOrdersCount,
    avgOrderValue,
    allTimeRevenue,
    todayRevenue,
  };
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
    take: 5,
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
