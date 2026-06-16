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

  const excludedIds = [
    // "rfxrlBvbryRERoUnpgoy6dXx495yZbou",
    "hBnoaYLfQSivXVOcNY5Bj2JgbTWXR4po",
    "ZnQ2LO4x1qu0rGOocGebxXvq0OdTNhqu",
  ];

  const filtered = participants.filter((p) => !excludedIds.includes(p.user.id));

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
      paid: false,
    },
  });
  console.log("update result", result);

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

export async function markAsPaidAction(windowId: string) {
  await requireAdmin();

  const window = await prisma.orderWindow.findUnique({
    where: { id: windowId },
    select: {
      winnerUserId: true,
      paid: true,
    },
  });

  if (!window) {
    return { success: false, error: "Window not found" };
  }

  if (!window.winnerUserId) {
    return { success: false, error: "Select a winner first" };
  }

  if (window.paid) {
    return { success: false, error: "Already marked as paid" };
  }

  await prisma.orderWindow.update({
    where: { id: windowId },
    data: { paid: true },
  });

  revalidatePath("/admin/history");
  revalidatePath("/history");

  return { success: true };
}
