import { prisma } from "@/lib/db";
import { buildDateFilter } from "@/lib/date-utils";

export async function getEmployeeRankings(
  organizationId: string,
  period: string,
) {
  const dateFilter = buildDateFilter(period);

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
      orders: number;
      spent: number;
    }
  >();

  for (const order of orders) {
    const orderTotal = order.items
      .filter((item) => !item.replacementApplied)
      .reduce(
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
