import { addDays, format, subYears } from "date-fns";
import type { UserOrderHistory } from "@/modules/orders/user-history-queries";

export function getHeatmapData(orders: UserOrderHistory) {
  const endDate = new Date();
  const startDate = subYears(endDate, 1);

  const orderMap = new Map<string, number>();
  for (const order of orders) {
    const date = format(order.createdAt, "yyyy-MM-dd");
    const orderTotal = order.items.reduce(
      (sum, item) => sum + Number(item.menuItem.price) * item.quantity,
      0,
    );
    orderMap.set(date, (orderMap.get(date) ?? 0) + orderTotal);
  }

  const data = [];

  for (let date = startDate; date <= endDate; date = addDays(date, 1)) {
    const key = format(date, "yyyy-MM-dd");

    data.push({
      date: key,
      spent: orderMap.get(key) ?? 0, // renamed from orders
    });
  }

  return data;
}
