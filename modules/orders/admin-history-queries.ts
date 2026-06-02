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
      orders: {
        include: {
          user: true,
          items: {
            include: {
              menuItem: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return windows.map((window) => ({
    ...window,
    orders: window.orders.map((order) => ({
      ...order,
      items: order.items.map((item) => ({
        ...item,
        menuItem: {
          ...item.menuItem,
          price: item.menuItem.price.toString(),
        },
      })),
    })),
  }));
}

export type AdminWindowHistory = Awaited<
  ReturnType<typeof getOrganizationOrderHistoryGroupedByWindow>
>;
