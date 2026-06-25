import { UserOrderHistory } from "@/modules/orders/user-history-queries";

type FavoriteItem = {
  menuItemId: string;
  name: string;
  quantity: number;
};

export function getFavoriteItems(orders: UserOrderHistory): FavoriteItem[] {
  const itemMap = new Map<
    string,
    {
      menuItemId: string;
      name: string;
      quantity: number;
    }
  >();

  for (const order of orders) {
    for (const item of order.items) {
      if (item.replacementApplied) continue;
      const existing = itemMap.get(item.menuItemId);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        itemMap.set(item.menuItemId, {
          menuItemId: item.menuItemId,
          name: item.menuItem.name,
          quantity: item.quantity,
        });
      }
    }
  }

  return Array.from(itemMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);
}
