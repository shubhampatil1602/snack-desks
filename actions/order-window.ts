"use server";

import { expireOrgData } from "@/lib/cache-tags";
import { prisma } from "@/lib/db";
import { authIsRequired, requireAdmin } from "./user";
import { notify } from "@/lib/sse/pg-notify";
import { nanoid } from "nanoid";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { closeWindowInternal } from "@/modules/order-window/close-window";

const createWindowSchema = z.object({
  label: z.string().trim().min(1, "Label is required"),
  duration: z.coerce.number().min(1).optional(), // in minutes, optional
  shopIds: z.array(z.string()).min(1, "Select at least one shop"),
});

export type CreateWindowInput = z.infer<typeof createWindowSchema>;
export type ActionResult =
  | { success: true }
  | { success: false; error: string };

export async function createWindowAction(
  input: CreateWindowInput,
): Promise<ActionResult> {
  const { session } = await requireAdmin();

  const parsed = createWindowSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }

  const member = await prisma.member.findFirst({
    where: { userId: session.user.id },
  });

  if (!member) {
    return { success: false, error: "Organization not found" };
  }

  // check if there's already an active window
  const existingWindow = await prisma.orderWindow.findFirst({
    where: {
      organizationId: member.organizationId,
      status: "active",
    },
  });

  if (existingWindow) {
    return {
      success: false,
      error: "An order window is already active. Close it first.",
    };
  }

  const shopIds = [...new Set(parsed.data.shopIds)];
  const ownShopCount = await prisma.shop.count({
    where: { id: { in: shopIds }, organizationId: member.organizationId },
  });

  if (ownShopCount !== shopIds.length) {
    return { success: false, error: "Shop not found" };
  }

  const startsAt = new Date();
  const endsAt = parsed.data.duration
    ? new Date(startsAt.getTime() + parsed.data.duration * 60 * 1000)
    : null;

  const window = await prisma.orderWindow.create({
    data: {
      id: nanoid(),
      label: parsed.data.label,
      status: "active",
      startsAt,
      endsAt,
      createdBy: session.user.id,
      shops: {
        connect: shopIds.map((id) => ({ id })),
      },
      organization: {
        connect: { id: member.organizationId },
      },
    },
  });

  // notify all connected clients
  await notify({
    type: "window_opened",
    orgId: member.organizationId,
    payload: {
      windowId: window.id,
      label: window.label,
      endsAt: window.endsAt?.toISOString() ?? null,
      startsAt: window.startsAt.toISOString(),
    },
  });

  expireOrgData(member.organizationId, "orders");
  revalidatePath("/admin/order-window");
  revalidatePath("/admin/dashboard");
  return { success: true };
}

export async function closeWindowAction(
  windowId: string,
): Promise<ActionResult> {
  const { session } = await requireAdmin();

  const member = await prisma.member.findFirst({
    where: { userId: session.user.id },
  });

  if (!member) {
    return { success: false, error: "Organization not found" };
  }

  const window = await prisma.orderWindow.findUnique({
    where: { id: windowId },
  });

  if (!window) {
    return { success: false, error: "Window not found" };
  }

  if (window.organizationId !== member.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  if (window.status === "closed") {
    return {
      success: false,
      error: "Window already closed",
    };
  }

  await closeWindowInternal(windowId);

  await notify({
    type: "window_closed",
    orgId: member.organizationId,
    payload: { windowId },
  });

  expireOrgData(member.organizationId, "orders");
  revalidatePath("/admin/order-window");
  revalidatePath("/admin/dashboard");
  return { success: true };
}

// Called by any viewer's countdown when the timer runs out, so the window
// closes (auto-approving pending orders) and everyone refreshes right away
// instead of on their next page load
export async function closeExpiredWindowAction(
  windowId: string,
): Promise<ActionResult> {
  const session = await authIsRequired();

  const member = await prisma.member.findFirst({
    where: { userId: session.user.id },
  });

  if (!member) {
    return { success: false, error: "Organization not found" };
  }

  const window = await prisma.orderWindow.findFirst({
    where: { id: windowId, organizationId: member.organizationId },
  });

  if (!window || window.status !== "active") {
    revalidatePath("/order-window");
    return { success: true };
  }

  if (!window.endsAt || window.endsAt > new Date()) {
    return { success: false, error: "Window is still open" };
  }

  const closed = await closeWindowInternal(windowId);

  if (closed) {
    await notify({
      type: "window_closed",
      orgId: member.organizationId,
      payload: { windowId },
    });

    expireOrgData(member.organizationId, "orders");
  }

  revalidatePath("/admin/order-window");
  revalidatePath("/admin/dashboard");
  revalidatePath("/order-window");
  return { success: true };
}
