import { prisma } from "@/lib/db";
import {
  parsePeriod,
  getISTDateParts,
  getISTDayBoundaries,
} from "@/lib/date-utils";
import { buildHeatmapDays } from "@/lib/get-heatmap-data";
import { spendLinesCte, IST_CREATED_AT } from "@/lib/spend-lines";
import { getEmployeeRankings } from "@/modules/rankings/queries";
import { subYears } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import {
  getPeriodRange,
  type RevenueTimeSeriesPoint,
  type CategoryRevenueSlice,
} from "@/modules/admin-dashboard/queries";

// Spend on this page uses spend lines, so split items count at the user's
// share (owner and co-splitters alike), the same as order history.

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

function getPeriodSpendRange(period: string) {
  const { startDate, endDate } = parsePeriod(period);
  return startDate && endDate ? { start: startDate, end: endDate } : undefined;
}

async function getUserSpendSummary(
  organizationId: string,
  userId: string,
  range?: { start: Date; end: Date },
) {
  const rows = await prisma.$queryRaw<
    { orderKey: string; shop: string; spent: number }[]
  >`
    ${spendLinesCte(organizationId, range)}
    SELECT
      l."orderKey",
      COALESCE(sh.name, 'Unknown Shop') AS shop,
      SUM(l.amount)::float AS spent
    FROM spend_lines l
    INNER JOIN "menu_item" m ON l."menuItemId" = m.id
    LEFT JOIN "shop" sh ON m."shopId" = sh.id
    WHERE l."userId" = ${userId}
    GROUP BY 1, 2
  `;

  let total = 0;
  const shopBreakdown: Record<string, number> = {};
  const orderKeys = new Set<string>();
  rows.forEach((row) => {
    const amt = Number(row.spent);
    total += amt;
    shopBreakdown[row.shop] = (shopBreakdown[row.shop] || 0) + amt;
    orderKeys.add(row.orderKey);
  });

  return { total, shopBreakdown, orders: orderKeys.size };
}

export async function getUserStats(
  organizationId: string,
  userId: string,
  period: string,
) {
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

  const [periodSpend, allTimeSpend, todaySpend, rankings] = await Promise.all([
    getUserSpendSummary(organizationId, userId, getPeriodSpendRange(period)),
    getUserSpendSummary(organizationId, userId),
    includesToday
      ? getUserSpendSummary(organizationId, userId, {
          start: dayStart,
          end: dayEnd,
        })
      : null,
    getEmployeeRankings(organizationId, period),
  ]);

  const totalOrders = periodSpend.orders;
  const averageOrderValue =
    totalOrders === 0 ? 0 : periodSpend.total / totalOrders;

  // Rank
  const currentUserRank = rankings.find((r) => r.userId === userId) ?? null;

  return {
    totalOrders,
    totalSpent: periodSpend.total,
    totalSpentShopBreakdown: periodSpend.shopBreakdown,
    averageOrderValue,
    currentRank: currentUserRank,
    allTimeSpent: allTimeSpend.total,
    allTimeSpentShopBreakdown: allTimeSpend.shopBreakdown,
    todaySpent: todaySpend ? todaySpend.total : null,
    todaySpentShopBreakdown: todaySpend ? todaySpend.shopBreakdown : {},
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
  // Includes windows where the user only shares someone else's item,
  // as order history does
  const orders = await prisma.$queryRaw<
    { id: string; createdAt: Date; windowLabel: string; total: number }[]
  >`
    ${spendLinesCte(organizationId, getPeriodSpendRange(period))}
    SELECT
      l."orderKey" AS id,
      MAX(l."createdAt") AS "createdAt",
      w.label AS "windowLabel",
      SUM(l.amount)::float AS total
    FROM spend_lines l
    INNER JOIN "order_window" w ON l."windowId" = w.id
    WHERE l."userId" = ${userId}
    GROUP BY l."orderKey", w.id
    ORDER BY 2 DESC
    LIMIT 5
  `;

  return orders.map((order) => ({
    id: order.id,
    status: "approved",
    createdAt: order.createdAt,
    windowLabel: order.windowLabel,
    total: Number(order.total),
  }));
}

export async function getUserHeatmapData(
  organizationId: string,
  userId: string,
) {
  const rangeEnd = new Date();
  const rows = await prisma.$queryRaw<{ date: string; spent: number }[]>`
    ${spendLinesCte(organizationId, { start: subYears(rangeEnd, 1), end: rangeEnd })}
    SELECT
      TO_CHAR(${IST_CREATED_AT}, 'YYYY-MM-DD') AS "date",
      SUM(l.amount)::float AS spent
    FROM spend_lines l
    WHERE l."userId" = ${userId}
    GROUP BY 1
  `;

  return buildHeatmapDays(
    new Map(rows.map((row) => [row.date, Number(row.spent)])),
  );
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

export async function getUserSpendingTimeSeries(
  organizationId: string,
  userId: string,
  period: string,
): Promise<RevenueTimeSeriesPoint[]> {
  const { rangeStart, rangeEnd } = getPeriodRange(period);
  const trunc = period.length === 7 ? "day" : "month";

  const rows = await prisma.$queryRaw<
    { bucket: Date; revenue: number; orders: bigint }[]
  >`
    ${spendLinesCte(organizationId, { start: rangeStart, end: rangeEnd })}
    SELECT
      DATE_TRUNC(${trunc}, ${IST_CREATED_AT}) AS bucket,
      COALESCE(SUM(l.amount), 0)::float AS revenue,
      COUNT(DISTINCT l."orderKey")::bigint AS orders
    FROM spend_lines l
    WHERE l."userId" = ${userId}
    GROUP BY 1
    ORDER BY 1 ASC
  `;

  // bucket holds IST wall-clock time read back as UTC, so format it in UTC
  const labelFormat =
    trunc === "day"
      ? (d: Date) => formatInTimeZone(d, "UTC", "d MMM")
      : (d: Date) => formatInTimeZone(d, "UTC", "MMM yyyy");

  return rows.map((row) => ({
    label: labelFormat(row.bucket),
    revenue: Number(row.revenue),
    orders: Number(row.orders),
  }));
}

export async function getUserSpendingByCategory(
  organizationId: string,
  userId: string,
  period: string,
): Promise<CategoryRevenueSlice[]> {
  const { rangeStart, rangeEnd } = getPeriodRange(period);

  const rows = await prisma.$queryRaw<{ category: string; revenue: number }[]>`
    ${spendLinesCte(organizationId, { start: rangeStart, end: rangeEnd })}
    SELECT
      mc.name AS category,
      COALESCE(SUM(l.amount), 0)::float AS revenue
    FROM spend_lines l
    INNER JOIN "menu_item" m ON l."menuItemId" = m.id
    INNER JOIN "menu_category" mc ON m."menuCategoryId" = mc.id
    WHERE l."userId" = ${userId}
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
