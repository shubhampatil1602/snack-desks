"use server";

import { prisma } from "@/lib/db";
import { authIsRequired, requireAdmin } from "./user";
import { notify } from "@/lib/sse/pg-notify";
import { nanoid } from "nanoid";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const orderItemSchema = z.object({
  menuItemId: z.string().min(1),
  quantity: z.number().min(1),
});

const placeOrderSchema = z.object({
  windowId: z.string().min(1),
  items: z.array(orderItemSchema).min(1, "Add at least one item"),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
export type ActionResult =
  | { success: true; orderId: string }
  | { success: false; error: string };

export async function placeOrderAction(
  input: PlaceOrderInput,
): Promise<ActionResult> {
  const session = await authIsRequired();

  const parsed = placeOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }

  const { windowId, items } = parsed.data;

  // verify window is still active
  const window = await prisma.orderWindow.findUnique({
    where: { id: windowId },
  });

  if (!window || window.status !== "active") {
    return { success: false, error: "Order window is no longer active" };
  }

  // check if window has expired
  if (window.endsAt && window.endsAt < new Date()) {
    await prisma.orderWindow.update({
      where: { id: windowId },
      data: { status: "closed" },
    });
    return { success: false, error: "Order window has expired" };
  }

  // check if user already has an order in this window
  const existingOrder = await prisma.order.findFirst({
    where: {
      windowId,
      userId: session.user.id,
      status: { not: "cancelled" },
    },
  });

  if (existingOrder) {
    return {
      success: false,
      error: "You already have an order. Update it instead.",
    };
  }

  const member = await prisma.member.findFirst({
    where: { userId: session.user.id },
  });

  if (!member) {
    return { success: false, error: "Organization not found" };
  }

  // create order + items in a transaction
  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        id: nanoid(),
        organizationId: member.organizationId,
        userId: session.user.id,
        windowId,
        status: "pending",
        updatedAt: new Date(),
      },
    });

    await tx.orderItem.createMany({
      data: items.map((item) => ({
        id: nanoid(),
        orderId: newOrder.id,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
      })),
    });

    return newOrder;
  });

  // notify admin via SSE
  await notify({
    type: "order_placed",
    orgId: member.organizationId,
    payload: {
      orderId: order.id,
      userId: session.user.id,
      userName: session.user.name,
    },
  });

  revalidatePath("/orders");
  return { success: true, orderId: order.id };
}

export async function updateOrderAction(
  orderId: string,
  items: PlaceOrderInput["items"],
): Promise<ActionResult> {
  const session = await authIsRequired();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { orderWindow: true },
  });

  if (!order) {
    return { success: false, error: "Order not found" };
  }

  if (order.status === "cancelled") {
    return {
      success: false,
      error: "Cancelled orders cannot be modified",
    };
  }

  if (order.userId !== session.user.id) {
    return { success: false, error: "Unauthorized" };
  }

  // check window is still active
  if (order.orderWindow.status !== "active") {
    return { success: false, error: "Order window is closed" };
  }

  if (order.orderWindow.endsAt && order.orderWindow.endsAt < new Date()) {
    return { success: false, error: "Order window has expired" };
  }

  if (order.status !== "pending") {
    return {
      success: false,
      error: "Order can no longer be modified",
    };
  }

  const member = await prisma.member.findFirst({
    where: { userId: session.user.id },
  });

  if (!member) {
    return { success: false, error: "Organization not found" };
  }

  // replace all items in a transaction
  await prisma.$transaction(async (tx) => {
    await tx.orderItem.deleteMany({ where: { orderId } });
    await tx.orderItem.createMany({
      data: items.map((item) => ({
        id: nanoid(),
        orderId,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
      })),
    });
    await tx.order.update({
      where: { id: orderId },
      data: { updatedAt: new Date() },
    });
  });

  await notify({
    type: "order_updated",
    orgId: member.organizationId,
    payload: { orderId },
  });

  revalidatePath("/orders");
  return { success: true, orderId: order.id };
}

export async function cancelOrderAction(
  orderId: string,
): Promise<ActionResult> {
  const session = await authIsRequired();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { orderWindow: true },
  });

  if (!order) {
    return { success: false, error: "Order not found" };
  }

  if (order.userId !== session.user.id) {
    return { success: false, error: "Unauthorized" };
  }

  if (order.orderWindow.status !== "active") {
    return { success: false, error: "Cannot cancel after window closes" };
  }

  if (order.status !== "pending") {
    return {
      success: false,
      error: "Order can no longer be cancelled",
    };
  }

  const member = await prisma.member.findFirst({
    where: { userId: session.user.id },
  });

  if (!member) {
    return { success: false, error: "Organization not found" };
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "cancelled" },
  });

  await notify({
    type: "order_cancelled",
    orgId: member.organizationId,
    payload: { orderId },
  });

  revalidatePath("/orders");
  return { success: true, orderId: order.id };
}

export async function updateOrderStatusAction(
  orderId: string,
  status: "approved" | "rejected",
): Promise<ActionResult> {
  const { session } = await requireAdmin();

  const member = await prisma.member.findFirst({
    where: {
      userId: session.user.id,
    },
  });

  if (!member) {
    return {
      success: false,
      error: "Organization not found",
    };
  }

  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
  });

  if (!order) {
    return {
      success: false,
      error: "Order not found",
    };
  }

  if (order.status === "cancelled") {
    return {
      success: false,
      error: "Cancelled orders cannot be modified",
    };
  }

  await prisma.order.update({
    where: {
      id: orderId,
    },
    data: {
      status,
    },
  });

  await notify({
    type: "order_status_changed",
    orgId: member.organizationId,
    payload: {
      orderId,
      status,
    },
  });

  revalidatePath("/admin/orders");

  return {
    success: true,
    orderId,
  };
}

export async function updateAdminOrderAction(
  orderId: string,
  items: {
    menuItemId: string;
    quantity: number;
  }[],
): Promise<ActionResult> {
  const { session } = await requireAdmin();

  const member = await prisma.member.findFirst({
    where: {
      userId: session.user.id,
    },
  });

  if (!member) {
    return {
      success: false,
      error: "Organization not found",
    };
  }

  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
  });

  if (!order) {
    return {
      success: false,
      error: "Order not found",
    };
  }

  if (order.status !== "approved") {
    return {
      success: false,
      error: "Only approved orders can be edited",
    };
  }

  if (items.length === 0) {
    await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        status: "cancelled",
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      orderId,
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.orderItem.deleteMany({
      where: {
        orderId,
      },
    });

    await tx.orderItem.createMany({
      data: items.map((item) => ({
        id: nanoid(),
        orderId,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
      })),
    });

    await tx.order.update({
      where: {
        id: orderId,
      },
      data: {
        updatedAt: new Date(),
      },
    });
  });

  await notify({
    type: "order_updated",
    orgId: member.organizationId,
    payload: {
      orderId,
    },
  });

  revalidatePath("/admin/orders");

  return {
    success: true,
    orderId,
  };
}
