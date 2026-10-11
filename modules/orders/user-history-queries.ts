import { prisma } from "@/lib/db";

export async function getUserOrderHistory(
  userId: string,
  period: string, // Add period parameter
) {
  // Parse period - supports "all", "YYYY", and "YYYY-MM"
  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (period === "all") {
    startDate = undefined;
    endDate = undefined;
  } else if (period.length === 4 && /^\d{4}$/.test(period)) {
    const year = Number(period);
    startDate = new Date(year, 0, 1);
    endDate = new Date(year, 11, 31, 23, 59, 59);
  } else if (period.length === 7 && /^\d{4}-\d{2}$/.test(period)) {
    const [year, month] = period.split("-");
    startDate = new Date(Number(year), Number(month) - 1, 1);
    endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
  } else {
    const now = new Date();
    const year = now.getFullYear();
    startDate = new Date(year, 0, 1);
    endDate = new Date(year, 11, 31, 23, 59, 59);
  }

  const dateFilter =
    startDate && endDate
      ? {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        }
      : {};

  const orderWindowSelect = {
    id: true,
    label: true,
    paid: true,
    createdAt: true,
    endsAt: true,
    winnerUserId: true,
    winnerUser: {
      select: {
        name: true,
      },
    },
    orders: {
      orderBy: {
        createdAt: "desc" as const,
      },
      select: {
        id: true,
        userId: true,
        status: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          select: {
            id: true,
            quantity: true,
            menuItemId: true,
            replacementApplied: true,
            originalOrderItemId: true,
            menuItem: {
              select: {
                name: true,
                price: true,
                shop: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            splits: {
              select: {
                id: true,
                userId: true,
                shareRatio: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            replacementPreferences: {
              select: {
                id: true,
                quantity: true,
                menuItem: {
                  select: {
                    name: true,
                    price: true,
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  const itemSelect = {
    id: true,
    quantity: true,
    menuItemId: true,
    replacementApplied: true,
    originalOrderItemId: true,
    menuItem: {
      select: {
        name: true,
        price: true,
        shop: {
          select: {
            name: true,
          },
        },
      },
    },
    splits: {
      select: {
        id: true,
        userId: true,
        shareRatio: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    },
    replacementPreferences: {
      select: {
        id: true,
        quantity: true,
        menuItem: {
          select: {
            name: true,
            price: true,
          },
        },
      },
    },
  };

  const [orders, splitOrders, member] = await Promise.all([
    prisma.order.findMany({
      where: {
        userId,
        status: "approved",
        ...dateFilter,
      },
      include: {
        items: {
          select: itemSelect,
        },
        orderWindow: {
          select: orderWindowSelect,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.order.findMany({
      where: {
        userId: { not: userId },
        status: "approved",
        ...dateFilter,
        items: {
          some: {
            splits: {
              some: {
                userId,
              },
            },
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          where: {
            splits: {
              some: {
                userId,
              },
            },
          },
          select: itemSelect,
        },
        orderWindow: {
          select: orderWindowSelect,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.member.findFirst({
      where: { userId },
      select: { canViewGlobalSplit: true },
    }),
  ]);

  const canViewGlobalSplit = member?.canViewGlobalSplit || false;

  const formatRawOrderItems = (rawItems: any[]) =>
    rawItems.map((item) => ({
      ...item,
      menuItem: {
        ...item.menuItem,
        price: item.menuItem.price.toString(),
      },
      replacementPreferences: (item.replacementPreferences || []).map(
        (rep: any) => ({
          ...rep,
          menuItem: {
            ...rep.menuItem,
            price: rep.menuItem.price.toString(),
          },
        }),
      ),
    }));

  type FormattedItem = {
    id: string;
    quantity: number;
    menuItemId: string;
    replacementApplied: boolean;
    originalOrderItemId: string | null;
    splitFraction?: string;
    menuItem: {
      name: string;
      price: string;
      shop: {
        name: string;
      } | null;
    };
    splits: {
      id?: string;
      userId: string;
      shareRatio?: number;
      user: {
        id?: string;
        name: string;
      };
    }[];
    replacementPreferences: {
      id: string;
      quantity: number;
      menuItem: {
        name: string;
        price: string;
      };
    }[];
  };

  const formatUserOwnedItem = (
    item: (typeof orders)[0]["items"][0],
  ): FormattedItem => {
    const splits = item.splits || [];
    const isSplit = splits.length > 0;
    const participantCount = splits.length + 1;
    const effectivePrice = isSplit
      ? (Number(item.menuItem.price) / participantCount).toFixed(2)
      : item.menuItem.price.toString();

    return {
      ...item,
      splitFraction: isSplit ? `1/${participantCount}` : undefined,
      menuItem: {
        ...item.menuItem,
        price: effectivePrice,
      },
      splits: splits.map((s) => ({
        id: s.id,
        userId: s.userId,
        shareRatio: s.shareRatio,
        user: {
          id: s.user.id,
          name: s.user.name,
        },
      })),
      replacementPreferences: (item.replacementPreferences || []).map((rep) => ({
        ...rep,
        menuItem: {
          ...rep.menuItem,
          price: rep.menuItem.price.toString(),
        },
      })),
    };
  };

  const formatCoSplitItem = (
    item: (typeof splitOrders)[0]["items"][0],
    orderUser: { id: string; name: string },
  ): FormattedItem => {
    const splits = item.splits || [];
    const participantCount = splits.length + 1;
    const effectivePrice = (
      Number(item.menuItem.price) / participantCount
    ).toFixed(2);

    const otherParticipants = [
      {
        id: `initiator-${orderUser.id}`,
        userId: orderUser.id,
        shareRatio: 1 / participantCount,
        user: {
          id: orderUser.id,
          name: orderUser.name,
        },
      },
      ...splits
        .filter((s) => s.userId !== userId)
        .map((s) => ({
          id: s.id,
          userId: s.userId,
          shareRatio: s.shareRatio,
          user: {
            id: s.user.id,
            name: s.user.name,
          },
        })),
    ];

    return {
      ...item,
      id: `${item.id}-split-${userId}`,
      splitFraction: `1/${participantCount}`,
      menuItem: {
        ...item.menuItem,
        price: effectivePrice,
      },
      splits: otherParticipants,
      replacementPreferences: (item.replacementPreferences || []).map((rep) => ({
        ...rep,
        menuItem: {
          ...rep.menuItem,
          price: rep.menuItem.price.toString(),
        },
      })),
    };
  };

  type FormattedOrder = {
    id: string;
    userId: string;
    organizationId: string;
    windowId: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    createdByAdmin: boolean;
    createdByUserId: string | null;
    canViewGlobalSplit: boolean;
    items: FormattedItem[];
    orderWindow: {
      id: string;
      label: string;
      paid: boolean;
      createdAt: Date;
      endsAt: Date | null;
      winnerUserId: string | null;
      winnerUser: {
        name: string;
      } | null;
      orders: any[];
    };
  };

  // 1. Process all of user's own orders
  const formattedUserOrders: FormattedOrder[] = orders.map((order) => ({
    ...order,
    canViewGlobalSplit,
    items: order.items.map(formatUserOwnedItem),
    orderWindow: {
      ...order.orderWindow,
      orders: (order.orderWindow.orders || [])
        .map((o) => ({
          ...o,
          items: formatRawOrderItems(o.items),
        }))
        .sort((a, b) => a.user.name.localeCompare(b.user.name)),
    },
  }));

  // 2. Track orders by windowId to attach co-splits if an order already exists
  const ordersByWindowId = new Map<string, FormattedOrder>();
  for (const order of formattedUserOrders) {
    if (!ordersByWindowId.has(order.windowId)) {
      ordersByWindowId.set(order.windowId, order);
    }
  }

  // 3. For any windows where user has no personal order, store synthetic orders
  const syntheticOrdersByWindowId = new Map<string, FormattedOrder>();

  for (const splitOrder of splitOrders) {
    const windowId = splitOrder.orderWindow.id;
    const coSplitItems = splitOrder.items.map((item) =>
      formatCoSplitItem(item, splitOrder.user),
    );

    const existingOrder = ordersByWindowId.get(windowId);
    if (existingOrder) {
      existingOrder.items.push(...coSplitItems);
    } else {
      let syntheticOrder = syntheticOrdersByWindowId.get(windowId);
      if (!syntheticOrder) {
        syntheticOrder = {
          id: `split-${windowId}-${userId}`,
          userId,
          organizationId: splitOrder.organizationId,
          windowId,
          status: "approved",
          createdAt: splitOrder.createdAt,
          updatedAt: splitOrder.updatedAt,
          createdByAdmin: false,
          createdByUserId: null,
          canViewGlobalSplit,
          items: [],
          orderWindow: {
            ...splitOrder.orderWindow,
            orders: (splitOrder.orderWindow.orders || [])
              .map((o) => ({
                ...o,
                items: formatRawOrderItems(o.items),
              }))
              .sort((a, b) => a.user.name.localeCompare(b.user.name)),
          },
        };
        syntheticOrdersByWindowId.set(windowId, syntheticOrder);
      }
      syntheticOrder.items.push(...coSplitItems);
    }
  }

  const allOrders = [
    ...formattedUserOrders,
    ...syntheticOrdersByWindowId.values(),
  ];

  allOrders.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return allOrders;
}

export type UserOrderHistory = Awaited<ReturnType<typeof getUserOrderHistory>>;
