import { prisma } from "@/lib/db";

export async function getLiveOrders(windowId: string) {
  const orders = await prisma.order.findMany({
    where: {
      windowId,
      status: {
        not: "cancelled",
      },
    },
    include: {
      user: true,
      items: {
        include: {
          menuItem: true,
          replacementPreferences: {
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

  return orders.map((order) => {
    const activeItems = order.items.filter((item) => !item.replacementApplied);

    return {
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

      total: activeItems.reduce(
        (sum, item) => sum + Number(item.menuItem.price) * item.quantity,
        0,
      ),
    };
  });
}

export type LiveOrder = Awaited<ReturnType<typeof getLiveOrders>>[number];
