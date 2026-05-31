import { CartItem } from "@/store/cart-store";

export function hasCartChanged(
  currentItems: CartItem[],
  savedItems: CartItem[],
) {
  if (currentItems.length !== savedItems.length) {
    return true;
  }

  const savedMap = new Map(
    savedItems.map((item) => [item.menuItemId, item.quantity]),
  );

  for (const item of currentItems) {
    const savedQuantity = savedMap.get(item.menuItemId);

    if (savedQuantity !== item.quantity) {
      return true;
    }
  }

  return false;
}
