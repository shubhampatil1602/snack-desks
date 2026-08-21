import { prisma } from "@/lib/db";
import { closeWindowInternal } from "@/actions/order-window";

export async function getActiveWindowWithMenu(organizationId: string) {
  const window = await prisma.orderWindow.findFirst({
    where: {
      organizationId,
      status: "active",
    },
    include: {
      shops: { select: { id: true } },
    },
  });

  // lazy close fallback
  if (window && window.endsAt && window.endsAt < new Date()) {
    await closeWindowInternal(window.id);
    return null;
  }

  if (!window) return null;

  const menuItems = await prisma.menuItem.findMany({
    where: {
      organizationId,
      isAvailable: true,
      ...(window.shops.length > 0 && {
        shopId: { in: window.shops.map((s) => s.id) },
      }),
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
