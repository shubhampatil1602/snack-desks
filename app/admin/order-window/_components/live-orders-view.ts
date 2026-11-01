import type { LiveOrder } from "@/modules/orders/admin-queries";

export type LiveOrderItem = LiveOrder["items"][number] & {
  // the copy of a shared item shown on a co-splitter's card
  isShareCopy?: boolean;
};

export type PersonOrder = Omit<LiveOrder, "items"> & {
  items: LiveOrderItem[];
  rawItems?: LiveOrder["items"];
  isCoSplitOnly?: boolean;
  hasSplit?: boolean;
  splitInitiatorNames?: string[];
};

export type ShoppingLine = {
  menuItemId: string;
  name: string;
  quantity: number;
  amount: number;
  // most people sharing one of these plates, 0 when nobody shares
  sharedBy: number;
  who: string[];
};

export type ShoppingShop = {
  name: string;
  amount: number;
  lines: ShoppingLine[];
};

function isOrderOn(order: { status: string }) {
  return order.status !== "cancelled" && order.status !== "rejected";
}

function getItemShareCost(item: LiveOrder["items"][number]): number {
  const participantCount =
    item.splits && item.splits.length > 0 ? item.splits.length + 1 : 1;
  return (Number(item.menuItem.price) * item.quantity) / participantCount;
}

// Orders and bill of the window, without rejected and cancelled orders
export function summarizeOrders(orders: LiveOrder[]) {
  const active = orders.filter(isOrderOn);
  return {
    count: active.length,
    bill: active.reduce((sum, order) => sum + order.total, 0),
  };
}

const FRACTIONS: Record<string, string> = {
  "1/2": "½",
  "1/3": "⅓",
  "2/3": "⅔",
  "1/4": "¼",
  "3/4": "¾",
};

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

// one person's part of a shared item: ½ for one plate shared by two
export function shareLabel(quantity: number, people: number) {
  if (quantity % people === 0) return `${quantity / people}×`;
  const divisor = gcd(quantity, people);
  const fraction = `${quantity / divisor}/${people / divisor}`;
  return FRACTIONS[fraction] ?? fraction;
}

// One card per person: their own items, plus their share of items someone
// else ordered and split with them.
export function groupOrdersByPerson(rawOrders: LiveOrder[]): PersonOrder[] {
  const userOrderMap = new Map<string, PersonOrder>();
  const otherOrders: PersonOrder[] = [];

  for (const order of rawOrders) {
    if (order.status === "cancelled") {
      otherOrders.push({
        ...order,
        rawItems: order.items,
        isCoSplitOnly: false,
        hasSplit: false,
      });
      continue;
    }

    const ownerItems: LiveOrderItem[] = [];
    const coSplitItemsMap = new Map<string, LiveOrderItem[]>();
    let orderHasSplit = false;

    for (const item of order.items) {
      const splits = item.splits || [];
      if (splits.length > 0) {
        orderHasSplit = true;
        const participantCount = splits.length + 1;

        ownerItems.push(item);

        // the co-splitters see the item shared with the owner and each other
        for (const split of splits) {
          const coSplitItem: LiveOrderItem = {
            ...item,
            id: `${item.id}-split-${split.userId}`,
            isShareCopy: true,
            splits: [
              {
                id: `owner-${order.userId}`,
                orderItemId: item.id,
                userId: order.userId,
                shareRatio: 1 / participantCount,
                status: "accepted",
                createdAt: new Date(),
                user: {
                  id: order.user.id,
                  name: order.user.name,
                  email: order.user.email,
                },
              },
              ...splits
                .filter((s) => s.userId !== split.userId)
                .map((s) => ({
                  ...s,
                  shareRatio: 1 / participantCount,
                })),
            ],
          };

          if (!coSplitItemsMap.has(split.userId)) {
            coSplitItemsMap.set(split.userId, []);
          }
          coSplitItemsMap.get(split.userId)!.push(coSplitItem);
        }
      } else {
        ownerItems.push(item);
      }
    }

    const ownerTotal = ownerItems
      .filter((i) => !i.replacementApplied)
      .reduce((sum, i) => sum + getItemShareCost(i), 0);

    if (!userOrderMap.has(order.userId)) {
      userOrderMap.set(order.userId, {
        ...order,
        rawItems: order.items,
        items: ownerItems,
        total: ownerTotal,
        isCoSplitOnly: false,
        hasSplit: orderHasSplit,
      });
    } else if (userOrderMap.get(order.userId)!.isCoSplitOnly) {
      // their card so far only held items shared with them: it becomes
      // their own order, with its status and actions
      const shared = userOrderMap.get(order.userId)!;
      userOrderMap.set(order.userId, {
        ...order,
        rawItems: order.items,
        items: [...ownerItems, ...shared.items],
        total: ownerTotal + shared.total,
        isCoSplitOnly: false,
        hasSplit: true,
        splitInitiatorNames: shared.splitInitiatorNames,
      });
    } else {
      const existing = userOrderMap.get(order.userId)!;
      existing.items.push(...ownerItems);
      existing.total += ownerTotal;
      if (orderHasSplit) existing.hasSplit = true;
      if (order.items) {
        existing.rawItems = [...(existing.rawItems || []), ...order.items];
      }
    }

    for (const [splitUserId, splitItems] of coSplitItemsMap.entries()) {
      const splitUserObj = order.items
        .flatMap((i) => i.splits || [])
        .find((s) => s.userId === splitUserId)?.user || {
        id: splitUserId,
        name: "Unknown User",
        email: "",
      };

      const splitUserTotal = splitItems
        .filter((i) => !i.replacementApplied)
        .reduce((sum, i) => sum + getItemShareCost(i), 0);

      if (userOrderMap.has(splitUserId)) {
        const existing = userOrderMap.get(splitUserId)!;
        existing.items.push(...splitItems);
        existing.total += splitUserTotal;
        existing.hasSplit = true;
        if (
          order.user.name &&
          !existing.splitInitiatorNames?.includes(order.user.name)
        ) {
          existing.splitInitiatorNames = [
            ...(existing.splitInitiatorNames || []),
            order.user.name,
          ];
        }
      } else {
        userOrderMap.set(splitUserId, {
          ...order,
          id: `split-${order.id}-${splitUserId}`,
          userId: splitUserId,
          user: {
            ...order.user,
            id: splitUserId,
            name: splitUserObj.name,
            email: splitUserObj.email,
          },
          items: splitItems,
          total: splitUserTotal,
          rawItems: undefined,
          isCoSplitOnly: true,
          hasSplit: true,
          splitInitiatorNames: order.user.name ? [order.user.name] : [],
          createdByAdmin: false,
        });
      }
    }
  }

  const result = [...userOrderMap.values(), ...otherOrders];
  result.sort((a, b) => a.user.name.localeCompare(b.user.name));
  return result;
}

// What to buy: the items of every order still on, added up per shop. A
// shared plate is bought once however many people pay for it, and a
// swapped-out item is left out (its alternatives are items of their own).
export function buildShoppingList(orders: LiveOrder[]): ShoppingShop[] {
  const shops = new Map<
    string,
    Map<string, ShoppingLine & { people: Map<string, number> }>
  >();

  for (const order of orders.filter(isOrderOn)) {
    for (const item of order.items) {
      if (item.replacementApplied) continue;

      const shopName = item.menuItem.shop?.name ?? "Other";
      if (!shops.has(shopName)) shops.set(shopName, new Map());
      const lines = shops.get(shopName)!;

      let line = lines.get(item.menuItemId);
      if (!line) {
        line = {
          menuItemId: item.menuItemId,
          name: item.menuItem.name,
          quantity: 0,
          amount: 0,
          sharedBy: 0,
          who: [],
          people: new Map(),
        };
        lines.set(item.menuItemId, line);
      }

      const splits = item.splits ?? [];
      line.quantity += item.quantity;
      line.amount += Number(item.menuItem.price) * item.quantity;

      const label =
        splits.length > 0
          ? `${[order.user.name, ...splits.map((s) => s.user.name)].join(" + ")} share`
          : order.user.name;
      if (splits.length > 0) {
        line.sharedBy = Math.max(line.sharedBy, splits.length + 1);
      }
      line.people.set(label, (line.people.get(label) ?? 0) + item.quantity);
    }
  }

  return [...shops.entries()]
    .map(([name, lines]) => {
      const shopLines = [...lines.values()]
        .map(({ people, ...line }) => ({
          ...line,
          who: [...people.entries()].map(([label, qty]) => `${label} ${qty}`),
        }))
        .sort(
          (a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name),
        );

      return {
        name,
        amount: shopLines.reduce((sum, line) => sum + line.amount, 0),
        lines: shopLines,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}
