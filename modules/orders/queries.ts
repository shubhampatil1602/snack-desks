import { prisma } from "@/lib/db";

export async function getActiveWindowWithMenu(organizationId: string) {
  const window = await prisma.orderWindow.findFirst({
    where: {
      organizationId,
      status: "active",
    },
  });

  // lazy close fallback
  if (window && window.endsAt && window.endsAt < new Date()) {
    await prisma.orderWindow.update({
      where: { id: window.id },
      data: { status: "closed" },
    });
    return null;
  }

  if (!window) return null;

  const menuItems = await prisma.menuItem.findMany({
    where: {
      organizationId,
      isAvailable: true,
    },
    include: { menuCategory: true, shop: true },
    orderBy: { createdAt: "asc" },
  });

  return {
    window,
    menuItems: menuItems.map((item) => ({
      ...item,
      price: item.price.toString(),
    })),
  };
}

export async function getUserActiveOrder(windowId: string, userId: string) {
  const order = await prisma.order.findFirst({
    where: {
      windowId,
      userId,
      status: { not: "cancelled" },
    },
    include: {
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
  });

  if (!order) return null;

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
  };
}

export type ActiveWindowWithMenu = Awaited<
  ReturnType<typeof getActiveWindowWithMenu>
>;
export type UserActiveOrder = Awaited<ReturnType<typeof getUserActiveOrder>>;
