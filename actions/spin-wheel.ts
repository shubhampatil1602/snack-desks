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

  const excludedIds = [
    "hBnoaYLfQSivXVOcNY5Bj2JgbTWXR4po",
    "ZnQ2LO4x1qu0rGOocGebxXvq0OdTNhqu",
  ];

  let previousWinnerId: string | null = null;
  try {
    const previousWindow = await prisma.orderWindow.findFirst({
      where: { id: { not: windowId }, winnerUserId: { not: null } },
      orderBy: { createdAt: "desc" },
      select: { winnerUserId: true },
    });
    previousWinnerId = previousWindow?.winnerUserId ?? null;
  } catch (e) {
    console.error("Failed to fetch previous winner", e);
  }

  let filtered: { id: string; name: string }[] = [];

  if (window.winnerUserId) {
    // Late-spin: Re-spin between current winner and all late orders
    const lateParticipants = await prisma.order.findMany({
      where: {
        windowId,
        status: { not: "cancelled" },
        createdByAdmin: true,
      },
      distinct: ["userId"],
      select: { user: { select: { id: true, name: true } } },
    });

    if (lateParticipants.length === 0) {
      return { success: false, error: "No late orders to spin" };
    }

    const currentWinner = await prisma.user.findUnique({
      where: { id: window.winnerUserId },
      select: { id: true, name: true },
    });

    const eligible = lateParticipants.filter(
      (p) =>
        !excludedIds.includes(p.user.id) &&
        (!previousWinnerId || p.user.id !== previousWinnerId),
    );

    const lateUserIds = new Set(eligible.map((p) => p.user.id));
    filtered = eligible.map((p) => p.user);

    if (currentWinner && !lateUserIds.has(currentWinner.id)) {
      const isExcluded =
        excludedIds.includes(currentWinner.id) ||
        (previousWinnerId && currentWinner.id === previousWinnerId);

      if (!isExcluded) {
        filtered.push(currentWinner);
      }
    }

    if (filtered.length === 0) {
      // Fallback: allow previous winner if they are the only ones available
      const fallbackEligible = lateParticipants.filter(
        (p) => !excludedIds.includes(p.user.id),
      );
      filtered = fallbackEligible.map((p) => p.user);

      if (currentWinner && !excludedIds.includes(currentWinner.id)) {
        if (!filtered.some((u) => u.id === currentWinner.id)) {
          filtered.push(currentWinner);
        }
      }

      if (filtered.length === 0) {
        return { success: false, error: "No eligible participants found" };
      }
    }
  } else {
    // Initial spin
    const participants = await prisma.order.findMany({
      where: {
        windowId,
        status: { not: "cancelled" },
      },
      distinct: ["userId"],
      select: {
        user: { select: { id: true, name: true } },
      },
    });

    if (participants.length === 0) {
      return { success: false, error: "No participants found" };
    }

    let eligible = participants.filter(
      (p) =>
        !excludedIds.includes(p.user.id) &&
        (!previousWinnerId || p.user.id !== previousWinnerId),
    );

    if (eligible.length === 0) {
      // Fallback: If excluding the previous winner leaves us with 0 participants,
      // allow the previous winner to participate (e.g. they are the only person in the window).
      const fallbackEligible = participants.filter(
        (p) => !excludedIds.includes(p.user.id),
      );
      if (fallbackEligible.length > 0) {
        eligible = fallbackEligible;
      } else {
        return { success: false, error: "No eligible participants found" };
      }
    }

    filtered = eligible.map((p) => p.user);
  }

  const winner = filtered[Math.floor(Math.random() * filtered.length)];

  await prisma.orderWindow.update({
    where: { id: windowId },
    data: {
      winnerUserId: winner.id,
      lastSpunAt: new Date(),
      paid: false,
    },
  });

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
