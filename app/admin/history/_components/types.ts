export type BreakdownItemData = {
  menuItemId: string;
  quantity: number;
  total: number;
  users: { orderId: string; userId: string; name: string; quantity: number }[];
};

export type ShopBreakdown = {
  shopName: string;
  total: number;
  items: Map<string, BreakdownItemData>;
  orderCount: number;
};
