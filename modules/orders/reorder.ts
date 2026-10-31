import type {
  ActiveWindowWithMenu,
  getUserReorderHistory,
} from "@/modules/orders/queries";

type WindowData = NonNullable<ActiveWindowWithMenu>;
type PastOrder = Awaited<ReturnType<typeof getUserReorderHistory>>[number];

export type RepeatOrder = {
  orderId: string;
  windowLabel: string;
  createdAt: Date;
  items: {
    menuItemId: string;
    name: string;
    price: string;
    quantity: number;
  }[];
  // shops of skipped items that aren't part of this window
  skippedShops: string[];
};

// same cap as the order form and placeOrderAction
const MAX_QUANTITY = 100;

// The user's latest past order that this window can repeat. Only items this
// window sells (its shops, available) are kept; unavailable items are skipped
// quietly, and an order with nothing left falls back to the one before it.
export function buildRepeatOrder(
  history: PastOrder[],
  windowData: WindowData,
): RepeatOrder | null {
  const menuById = new Map(windowData.menuItems.map((item) => [item.id, item]));
  const windowShopIds = new Set(windowData.window.shops.map((shop) => shop.id));

  function toRepeatOrder(order: PastOrder): RepeatOrder | null {
    const quantities = new Map<string, number>();
    const skippedShops = new Set<string>();

    for (const item of order.items) {
      if (menuById.has(item.menuItemId)) {
        quantities.set(
          item.menuItemId,
          (quantities.get(item.menuItemId) ?? 0) + item.quantity,
        );
      } else if (
        windowShopIds.size > 0 &&
        !(item.menuItem.shopId && windowShopIds.has(item.menuItem.shopId))
      ) {
        skippedShops.add(item.menuItem.shop?.name ?? "Unknown shop");
      }
    }

    if (quantities.size === 0) return null;

    return {
      orderId: order.id,
      windowLabel: order.orderWindow.label,
      createdAt: order.createdAt,
      items: [...quantities].map(([menuItemId, quantity]) => {
        const menuItem = menuById.get(menuItemId)!;
        return {
          menuItemId,
          name: menuItem.name,
          price: menuItem.price,
          quantity: Math.min(quantity, MAX_QUANTITY),
        };
      }),
      skippedShops: [...skippedShops],
    };
  }

  for (const order of history) {
    if (order.windowId === windowData.window.id) continue;
    const repeatOrder = toRepeatOrder(order);
    if (repeatOrder) return repeatOrder;
  }

  return null;
}
