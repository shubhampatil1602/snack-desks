import { prisma } from "@/lib/db";

export async function getUserOrderHistory(
  userId: string,
  period: string, // Add period parameter
) {
  // Parse period - supports "all", "YYYY", and "YYYY-MM"
  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (period === "all") {
    startDate = undefined;
    endDate = undefined;
  } else if (period.length === 4 && /^\d{4}$/.test(period)) {
    const year = Number(period);
    startDate = new Date(year, 0, 1);
    endDate = new Date(year, 11, 31, 23, 59, 59);
  } else if (period.length === 7 && /^\d{4}-\d{2}$/.test(period)) {
    const [year, month] = period.split("-");
    startDate = new Date(Number(year), Number(month) - 1, 1);
    endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
  } else {
    const now = new Date();
    const year = now.getFullYear();
    startDate = new Date(year, 0, 1);
    endDate = new Date(year, 11, 31, 23, 59, 59);
  }

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
      userId,
      status: "approved",
      ...dateFilter,
    },
    include: {
      items: {
        select: {
          id: true,
          quantity: true,
          menuItemId: true,
          replacementApplied: true,
          originalOrderItemId: true,
          menuItem: {
            select: {
              name: true,
              price: true,
            },
          },
          replacementPreferences: {
            select: {
              id: true,
              quantity: true,
              menuItem: {
                select: {
                  name: true,
                  price: true,
                },
              },
            },
          },
        },
      },
      orderWindow: {
        select: {
          label: true,
          paid: true,
          winnerUserId: true,
          winnerUser: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return orders.map((order) => ({
    ...order,
    items: order.items.map((item) => ({
      ...item,
      menuItem: {
        ...item.menuItem,
        price: item.menuItem.price.toString(),
      },
      replacementPreferences: item.replacementPreferences.map((rep) => ({
        ...rep,
        menuItem: {
          ...rep.menuItem,
          price: rep.menuItem.price.toString(),
        },
      })),
    })),
  }));
}

export type UserOrderHistory = Awaited<ReturnType<typeof getUserOrderHistory>>;
