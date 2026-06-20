import { prisma } from "@/lib/db";

export async function getEmployeeRankings(
  organizationId: string,
  period: string,
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

  const orders = await prisma.order.findMany({
    where: {
      organizationId,
      status: "approved",
      ...dateFilter,
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
      orders: number;
      spent: number;
    }
  >();

  for (const order of orders) {
    const orderTotal = order.items.reduce(
      (sum, item) => sum + Number(item.menuItem.price) * item.quantity,
      0,
    );

    const existing = rankingsMap.get(order.userId);

    if (existing) {
      existing.orders += 1;
      existing.spent += orderTotal;
    } else {
      rankingsMap.set(order.userId, {
        userId: order.user.id,
        name: order.user.name,
        orders: 1,
        spent: orderTotal,
      });
    }
  }

  return Array.from(rankingsMap.values())
    .sort((a, b) => b.spent - a.spent)
    .map((employee, index) => ({
      rank: index + 1,
      ...employee,
    }));
}

export type EmployeeRanking = Awaited<
  ReturnType<typeof getEmployeeRankings>
>[number];
