import { CartItem } from "@/store/cart-store";

export function hasCartChanged(
  currentItems: CartItem[],
  savedItems: CartItem[],
) {
  if (currentItems.length !== savedItems.length) {
    return true;
  }

  const savedMap = new Map(
    savedItems.map((item) => [item.menuItemId, item]),
  );

  for (const item of currentItems) {
    const savedItem = savedMap.get(item.menuItemId);

    if (!savedItem || savedItem.quantity !== item.quantity) {
      return true;
    }

    // Compare replacements
    const currentReps = item.replacements || [];
    const savedReps = savedItem.replacements || [];

    if (currentReps.length !== savedReps.length) {
      return true;
    }

    const savedRepMap = new Map(
      savedReps.map((r) => [r.menuItemId, r.quantity]),
    );

    for (const rep of currentReps) {
      const savedRepQty = savedRepMap.get(rep.menuItemId);
      if (savedRepQty !== rep.quantity) {
        return true;
      }
    }
  }

  return false;
}
