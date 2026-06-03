import { prisma } from "@/lib/db";

export async function getEmployeeRankings(organizationId: string) {
  const orders = await prisma.order.findMany({
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
