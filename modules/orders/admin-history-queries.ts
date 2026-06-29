import { prisma } from "@/lib/db";

export async function getOrganizationOrderHistoryGroupedByWindow(
  organizationId: string,
) {
  const windows = await prisma.orderWindow.findMany({
    where: {
      organizationId,
      status: "closed",
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
