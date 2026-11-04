import { tagOrgData } from "@/lib/cache-tags";
import { prisma } from "@/lib/db";
import { participantsOf } from "@/modules/order-window/spin-draw";

export async function getOrganizationOrderHistoryGroupedByWindow(
  organizationId: string,
  period: string,
) {
  "use cache: remote";
  tagOrgData(organizationId, "orders", "menu", "members");

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

  const windows = await prisma.orderWindow.findMany({
    where: {
      organizationId,
      status: "closed",
      ...dateFilter,
    },
    include: {
      shops: {
        select: {
          id: true,
        },
      },
      winnerUser: {
        select: {
          id: true,
          name: true,
        },
      },
      orders: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: true,
          items: {
            include: {
              menuItem: {
                include: {
                  shop: true,
                },
              },
              splits: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
              replacementPreferences: {
                include: {
                  menuItem: {
                    include: {
                      shop: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const now = Date.now();

  return windows.map((window) => {
    const windowDate = new Date(window.createdAt).getTime();
    const diffInDays = (now - windowDate) / (1000 * 3600 * 24);
    const isLocked = diffInDays > 7;

    return {
      ...window,
      isLocked,
      // the winner's order was cancelled or they were taken off a share
      // after the spin, so the window needs a fresh spin
      winnerLeft:
        !!window.winnerUserId &&
        !participantsOf(window.orders).some((user) => user.id === window.winnerUserId),
      orders: (() => {
        const seenUsers = new Set<string>();
        return window.orders
          .filter((order) => {
            if (seenUsers.has(order.userId)) return false;
            seenUsers.add(order.userId);
            return true;
          })
          .map((order) => ({
            ...order,
            items: order.items.map((item) => ({
              ...item,
              unitPrice: item.unitPrice.toString(),
              // a line shows the price it was ordered at, not today's menu price
              menuItem: {
                ...item.menuItem,
                price: item.unitPrice.toString(),
                shop: item.menuItem.shop,
              },
              replacementPreferences: item.replacementPreferences.map((rep) => ({
                ...rep,
                menuItem: {
                  ...rep.menuItem,
                  price: rep.menuItem.price.toString(),
                },
              })),
            })),
          }))
          .sort((a, b) => a.user.name.localeCompare(b.user.name));
      })(),
    };
  });
}

export type AdminWindowHistory = Awaited<
  ReturnType<typeof getOrganizationOrderHistoryGroupedByWindow>
>;
