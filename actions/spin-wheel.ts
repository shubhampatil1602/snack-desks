"use server";

import { requireAdmin } from "@/actions/user";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function spinWheelAction(windowId: string) {
  await requireAdmin();

  const window = await prisma.orderWindow.findUnique({
    where: {
      id: windowId,
    },
    select: {
      winnerUserId: true,
    },
  });

  if (!window) {
    return {
      success: false,
      error: "Order window not found",
    };
  }

  if (window.winnerUserId) {
    return {
      success: false,
      error: "Winner already selected",
    };
  }

  const participants = await prisma.order.findMany({
    where: {
      windowId,
      status: {
        not: "cancelled",
      },
    },
    distinct: ["userId"],
    select: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (participants.length === 0) {
    return {
      success: false,
      error: "No participants found",
    };
  }

  const filtered = participants.filter(
    (p) => p.user.id !== "rfxrlBvbryRERoUnpgoy6dXx495yZbou",
  );

  if (filtered.length === 0) {
    return {
      success: false,
      error: "No eligible participants found",
    };
  }

  const winner = filtered[Math.floor(Math.random() * filtered.length)].user;

  const result = await prisma.orderWindow.updateMany({
    where: {
      id: windowId,
      winnerUserId: null,
    },
    data: {
      winnerUserId: winner.id,
    },
  });

  if (result.count === 0) {
    return {
      success: false,
      error: "Winner already selected",
    };
  }

  revalidatePath("/admin/history");
  revalidatePath("/history");

  return {
    success: true,
    winner,
  };
}
