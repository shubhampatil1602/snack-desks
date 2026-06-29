import { prisma } from "@/lib/db";

export async function getOrganizationOrderHistoryGroupedByWindow(
  organizationId: string,
  period: string,
) {
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

  const windows = await prisma.orderWindow.findMany({
    where: {
      organizationId,
      status: "closed",
      ...dateFilter,
    },
    include: {
      winnerUser: {
        select: {
          id: true,
          name: true,
        },
      },
      orders: {
        include: {
          user: true,
          items: {
            include: {
              menuItem: {
                include: {
                  shop: true,
                },
              },
              replacementPreferences: {
                include: {
                  menuItem: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const now = Date.now();

  return windows.map((window) => {
    const windowDate = new Date(window.createdAt).getTime();
    const diffInDays = (now - windowDate) / (1000 * 3600 * 24);
    const isLocked = diffInDays > 7;

    return {
      ...window,
      isLocked,
      orders: window.orders.map((order) => ({
        ...order,
        items: order.items.map((item) => ({
          ...item,
          menuItem: {
            ...item.menuItem,
            price: item.menuItem.price.toString(),
            shop: item.menuItem.shop,
          },
          replacementPreferences: item.replacementPreferences.map((rep) => ({
            ...rep,
            menuItem: {
              ...rep.menuItem,
              price: rep.menuItem.price.toString(),
            },
          })),
        })),
      })),
    };
  });
}

export type AdminWindowHistory = Awaited<
  ReturnType<typeof getOrganizationOrderHistoryGroupedByWindow>
>;
