"use server";

import { expireOrgData } from "@/lib/cache-tags";
import { requireAdmin } from "@/actions/user";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getSpinDraw } from "@/modules/order-window/spin-draw";

// Who is in the draw, so the spin dialog can put their names on the wheel
export async function getSpinDrawAction(windowId: string) {
  const { member } = await requireAdmin();
  const draw = await getSpinDraw(windowId, member.organizationId);

  if (!draw.ok) return { success: false as const, error: draw.error };

  return {
    success: true as const,
    candidates: draw.onWheel,
    sittingOut: draw.sittingOut,
  };
}

export async function spinWheelAction(windowId: string) {
  const { member } = await requireAdmin();
  const draw = await getSpinDraw(windowId, member.organizationId);

  if (!draw.ok) {
    return {
      success: false,
      error: draw.error,
    };
  }

  const winner = draw.eligible[Math.floor(Math.random() * draw.eligible.length)];

  await prisma.orderWindow.update({
    where: { id: windowId },
    data: {
      winnerUserId: winner.id,
      originalWinnerUserId: draw.window.originalWinnerUserId || winner.id,
      lastSpunAt: new Date(),
      paid: false,
    },
  });

  expireOrgData(member.organizationId, "orders");
  revalidatePath("/admin/history");
  revalidatePath("/history");

  // the names on the wheel, so it can land on the winner even if
  // someone ordered late after the dialog opened
  return {
    success: true,
    winner,
    candidates: draw.onWheel,
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
