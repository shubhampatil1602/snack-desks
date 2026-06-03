import { closeWindowInternal } from "@/actions/order-window";
import { prisma } from "@/lib/db";

export async function getActiveWindow(organizationId: string) {
  const window = await prisma.orderWindow.findFirst({
    where: {
      organizationId,
      status: "active",
    },
  });

  // lazy close — if endsAt has passed, treat as closed
  if (window && window.endsAt && window.endsAt < new Date()) {
    await closeWindowInternal(window.id);
    return null;
  }

  return window;
}

export async function getTodaysWindows(organizationId: string) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  return await prisma.orderWindow.findMany({
    where: {
      organizationId,
      createdAt: { gte: startOfDay },
    },
    include: {
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export type ActiveWindow = Awaited<ReturnType<typeof getActiveWindow>>;
export type TodaysWindow = Awaited<ReturnType<typeof getTodaysWindows>>[number];
