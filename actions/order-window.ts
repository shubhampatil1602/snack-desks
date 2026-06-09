"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "./user";
import { notify } from "@/lib/sse/pg-notify";
import { nanoid } from "nanoid";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const createWindowSchema = z.object({
  label: z.string().min(1, "Label is required"),
  duration: z.coerce.number().min(1).optional(), // in minutes, optional
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

  revalidatePath("/admin/order-window");
  revalidatePath("/admin/dashboard");
  return { success: true };
}

export async function closeWindowInternal(windowId: string) {
  await prisma.$transaction(async (tx) => {
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

      return;
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

    await tx.orderWindow.update({
      where: {
        id: windowId,
      },
      data: {
        status: "closed",
        endsAt: new Date(),
      },
    });
  });
}
