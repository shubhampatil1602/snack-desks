import { after } from "next/server";

import { prisma } from "@/lib/db";
import { pushToOrg, pushToUsers } from "@/lib/push";

// Kept out of actions/: exports of a "use server" file are public endpoints.
// Returns false when the window was not active (e.g. another viewer's
// countdown already closed it), so callers notify only once.
export async function closeWindowInternal(windowId: string): Promise<boolean> {
  const closed = await closeOnce(windowId);
  // every way a window closes comes through here (admin, countdown, lazy
  // close), and only the caller that closed it gets here with a window
  if (closed) after(() => pushWindowClosed(closed));
  return !!closed;
}

type ClosedWindow = { id: string; organizationId: string; label: string; orderedUserIds: string[] };

// people who ordered (or share an item) hear their order is in; everyone
// else that they missed it. Same tag as the "window is open" push, so this
// one replaces it.
async function pushWindowClosed({ id, organizationId, label, orderedUserIds }: ClosedWindow) {
  const message = { url: "/history", tag: `window-${id}` };
  await Promise.all([
    pushToUsers(orderedUserIds, {
      ...message,
      title: `🔒 ${label} order window is closed`,
      body: "Your order is in. The spin picks who pays the shop.",
    }),
    pushToOrg(
      organizationId,
      { ...message, url: "/order-window", title: `🔒 ${label} order window is closed`, body: "You didn't order this time." },
      { roles: ["member"], exceptUserIds: orderedUserIds },
    ),
  ]);
}

async function closeOnce(windowId: string): Promise<ClosedWindow | null> {
  return prisma.$transaction(async (tx) => {
    // claim the window first so concurrent callers close it only once
    const claimed = await tx.orderWindow.updateMany({
      where: {
        id: windowId,
        status: "active",
      },
      data: {
        status: "closed",
        endsAt: new Date(),
      },
    });

    if (claimed.count === 0) {
      return null;
    }

    const window = await tx.orderWindow.findUniqueOrThrow({
      where: { id: windowId },
      select: { id: true, organizationId: true, label: true },
    });
    const ordered = await tx.order.findMany({
      where: { windowId, status: { in: ["pending", "approved"] } },
      select: { userId: true, items: { select: { splits: { select: { userId: true } } } } },
    });
    const orderedUserIds = [
      ...new Set(
        ordered.flatMap((order) => [
          order.userId,
          ...order.items.flatMap((item) => item.splits.map((split) => split.userId)),
        ]),
      ),
    ];
    const closed = { ...window, orderedUserIds };

    const orderCount = await tx.order.count({
      where: {
        windowId,
      },
    });

    // no orders placed - delete window completely
    if (orderCount === 0) {
      await tx.orderWindow.delete({
        where: {
          id: windowId,
        },
      });

      return closed;
    }

    await tx.order.updateMany({
      where: {
        windowId,
        status: "pending",
      },
      data: {
        status: "approved",
      },
    });

    return closed;
  });
}
