import { prisma } from "@/lib/db";
import { tagOrgData } from "@/lib/cache-tags";
import { closeWindowInternal } from "@/modules/order-window/close-window";

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
          menuItem: {
            include: { shop: true },
          },
          splits: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
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
  });

  if (!order) return null;

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
  };
}

// History for "Repeat previous order": recent approved orders.
// Only items the user picked count (not replacements an admin swapped in).
export async function getUserReorderHistory(
  organizationId: string,
  userId: string,
) {
  "use cache: remote";
  tagOrgData(organizationId, "orders", "menu");

  const orderSelect = {
    id: true,
    windowId: true,
    createdAt: true,
    orderWindow: { select: { label: true } },
    items: {
      where: { originalOrderItemId: null },
      select: {
        menuItemId: true,
        quantity: true,
        menuItem: {
          select: { shopId: true, shop: { select: { name: true } } },
        },
      },
    },
  } as const;

  return prisma.order.findMany({
    where: { organizationId, userId, status: "approved" },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: orderSelect,
  });
}

export type ActiveWindowWithMenu = Awaited<
  ReturnType<typeof getActiveWindowWithMenu>
>;
export type UserActiveOrder = Awaited<ReturnType<typeof getUserActiveOrder>>;
