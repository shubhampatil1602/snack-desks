"use server";

import { expireOrgData } from "@/lib/cache-tags";
import { authIsRequired, getCurrentMember, requireAdmin } from "@/actions/user";
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
      winnerPaidAt: null,
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

// The spin winner says they paid the shop's bill, so the admin can mark it paid
export async function markBillPaidAction(windowId: string) {
  await authIsRequired();
  const member = await getCurrentMember();
  if (!member) return { success: false, error: "You're not in an organization" };

  const window = await prisma.orderWindow.findFirst({
    where: { id: windowId, organizationId: member.organizationId },
    select: { winnerUserId: true, winnerPaidAt: true, paid: true },
  });

  if (!window) {
    return { success: false, error: "Window not found" };
  }

  if (window.winnerUserId !== member.userId) {
    return { success: false, error: "Only the split master can say the bill is paid" };
  }

  if (window.paid || window.winnerPaidAt) {
    return { success: false, error: "Already marked as paid" };
  }

  await prisma.orderWindow.update({
    where: { id: windowId },
    data: { winnerPaidAt: new Date() },
  });

  expireOrgData(member.organizationId, "orders");
  revalidatePath("/admin/history");
  revalidatePath("/history");

  return { success: true };
}

export async function markAsPaidAction(windowId: string) {
  const { member } = await requireAdmin();

  const window = await prisma.orderWindow.findFirst({
    where: { id: windowId, organizationId: member.organizationId },
    select: {
      winnerUserId: true,
      winnerPaidAt: true,
      paid: true,
      winnerUser: { select: { name: true } },
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

  if (!window.winnerPaidAt) {
    const name = window.winnerUser?.name.split(" ")[0] ?? "The winner";
    return { success: false, error: `${name} hasn't paid the bill yet` };
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
