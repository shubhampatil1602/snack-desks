"use server";

import { expireOrgData } from "@/lib/cache-tags";
import { requireAdmin } from "@/actions/user";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { SPIN_EXCLUDED_USER_IDS } from "@/lib/constants";

type SpinCandidate = { id: string; name: string };

// Relaxes the rules only when nobody is left, so a window always gets a winner:
// 1. not excluded and not the previous window's winner
// 2. not excluded (the previous winner may win again)
// 3. anyone who ordered (excluded users win only if they're the only ones)
function pickEligible(
  candidates: SpinCandidate[],
  previousWinnerId: string | null,
) {
  const notExcluded = candidates.filter(
    (user) => !SPIN_EXCLUDED_USER_IDS.includes(user.id),
  );
  const notPreviousWinner = notExcluded.filter(
    (user) => user.id !== previousWinnerId,
  );

  if (notPreviousWinner.length > 0) return notPreviousWinner;
  if (notExcluded.length > 0) return notExcluded;
  return candidates;
}

export async function spinWheelAction(windowId: string) {
  const { member } = await requireAdmin();

  const window = await prisma.orderWindow.findFirst({
    where: {
      id: windowId,
      organizationId: member.organizationId,
    },
    select: {
      winnerUserId: true,
      originalWinnerUserId: true,
      lastSpunAt: true,
    },
  });

  if (!window) {
    return {
      success: false,
      error: "Order window not found",
    };
  }

  let previousWinnerId: string | null = null;
  try {
    const previousWindow = await prisma.orderWindow.findFirst({
      where: {
        organizationId: member.organizationId,
        id: { not: windowId },
        winnerUserId: { not: null },
      },
      orderBy: { createdAt: "desc" },
      select: { winnerUserId: true },
    });
    previousWinnerId = previousWindow?.winnerUserId ?? null;
  } catch (e) {
    console.error("Failed to fetch previous winner", e);
  }

  let candidates: SpinCandidate[] = [];

  if (window.winnerUserId) {
    // Late-spin: Re-spin between current winner and all late orders
    const lateParticipants = await prisma.order.findMany({
      where: {
        windowId,
        status: { not: "cancelled" },
        createdByAdmin: true,
        ...(window.lastSpunAt ? { createdAt: { gt: window.lastSpunAt } } : {}),
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

    candidates = lateParticipants.map((p) => p.user);
    if (currentWinner && !candidates.some((u) => u.id === currentWinner.id)) {
      candidates.push(currentWinner);
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

    candidates = participants.map((p) => p.user);
  }

  const filtered = pickEligible(candidates, previousWinnerId);

  const winner = filtered[Math.floor(Math.random() * filtered.length)];

  await prisma.orderWindow.update({
    where: { id: windowId },
    data: {
      winnerUserId: winner.id,
      originalWinnerUserId: window.originalWinnerUserId || winner.id,
      lastSpunAt: new Date(),
      paid: false,
    },
  });

  expireOrgData(member.organizationId, "orders");
  revalidatePath("/admin/history");
  revalidatePath("/history");

  return {
    success: true,
    winner,
  };
}

export async function markAsPaidAction(windowId: string) {
  const { member } = await requireAdmin();

  const window = await prisma.orderWindow.findFirst({
    where: { id: windowId, organizationId: member.organizationId },
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

  expireOrgData(member.organizationId, "orders");
  revalidatePath("/admin/history");
  revalidatePath("/history");

  return { success: true };
}
