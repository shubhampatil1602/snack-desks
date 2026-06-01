import { prisma } from "@/lib/db";

export async function getUserOrderHistory(userId: string) {
  const orders = await prisma.order.findMany({
    where: {
      userId,
    },
    include: {
      orderWindow: true,
      items: {
        include: {
          menuItem: true,
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
    })),
  }));
}

export type UserOrderHistory = Awaited<ReturnType<typeof getUserOrderHistory>>;
