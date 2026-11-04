import { prisma } from "@/lib/db";

export async function getLiveOrders(windowId: string) {
  const orders = await prisma.order.findMany({
    where: {
      windowId,
    },
    include: {
      user: true,
      items: {
        include: {
          menuItem: {
            include: {
              shop: true,
            },
          },
          splits: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
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
        unitPrice: item.unitPrice.toString(),
        // a line shows the price it was ordered at, not today's menu price
        menuItem: {
          ...item.menuItem,
          price: item.unitPrice.toString(),
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
        (sum, item) => sum + Number(item.unitPrice) * item.quantity,
        0,
      ),
    };
  });
}

export type LiveOrder = Awaited<ReturnType<typeof getLiveOrders>>[number];


