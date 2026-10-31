import { prisma } from "@/lib/db";

// Kept out of actions/: exports of a "use server" file are public endpoints.
// Returns false when the window was not active (e.g. another viewer's
// countdown already closed it), so callers notify only once.
export async function closeWindowInternal(windowId: string): Promise<boolean> {
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
      return false;
    }

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

      return true;
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

    return true;
  });
}
