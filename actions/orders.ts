"use server";

import { expireOrgData } from "@/lib/cache-tags";
import { prisma } from "@/lib/db";
import { authIsRequired, requireAdmin } from "./user";
import { notify } from "@/lib/sse/pg-notify";
import { nanoid } from "nanoid";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { closeWindowInternal } from "@/modules/order-window/close-window";
import { checkRateLimit } from "@/lib/rate-limit";
import type { Prisma } from "@/lib/generated/prisma/client";

const orderItemSchema = z.object({
  menuItemId: z.string().min(1),
  quantity: z.number().int().min(1).max(100),
  splitUserIds: z.array(z.string()).optional(),
  replacements: z
    .array(
      z.object({
        menuItemId: z.string().min(1),
        quantity: z.number().int().min(1).max(100),
      }),
    )
    .optional(),
});

const orderItemsSchema = z.array(orderItemSchema);

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
  const rateLimit = await checkRateLimit("order:place", 15, 60_000);
  if (!rateLimit.success) {
    return {
      success: false,
      error: "Too many order requests. Please wait a moment before trying again.",
    };
  }

  const session = await authIsRequired();

  const parsed = placeOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }

  const { windowId, items } = parsed.data;

  const member = await prisma.member.findFirst({
    where: { userId: session.user.id },
  });

  if (!member) {
    return { success: false, error: "Organization not found" };
  }

  // verify window is still active
  const window = await prisma.orderWindow.findUnique({
    where: { id: windowId },
  });

  if (
    !window ||
    window.organizationId !== member.organizationId ||
    window.status !== "active"
  ) {
    return { success: false, error: "Order window is no longer active" };
  }

  // check if window has expired
  if (window.endsAt && window.endsAt < new Date()) {
    await closeWindowInternal(windowId);
    expireOrgData(member.organizationId, "orders");
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

  const itemsError = await validateOrderItems(
    member.organizationId,
    windowId,
    items,
    { requireAvailable: true },
  );
  if (itemsError) {
    return { success: false, error: itemsError };
  }

  // create order + items in a transaction
  let order;
  try {
    order = await prisma.$transaction(async (tx) => {
      // re-verify window inside transaction to prevent race conditions
      const currentWindow = await tx.orderWindow.findUnique({
        where: { id: windowId },
      });

      if (!currentWindow || currentWindow.status !== "active") {
        throw new Error("Order window is no longer active");
      }

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

      await createOrderItems(tx, newOrder.id, items, session.user.id);

      return newOrder;
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }

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

  expireOrgData(member.organizationId, "orders");
  revalidatePath("/order-window");
  return { success: true, orderId: order.id };
}

export async function updateOrderAction(
  orderId: string,
  input: PlaceOrderInput["items"],
): Promise<ActionResult> {
  const session = await authIsRequired();

  const parsed = orderItemsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }

  const items = parsed.data;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { orderWindow: true, items: true },
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

  // Check if any items in the order have replacements applied
  const hasReplacedItems = order.items.some((item) => item.replacementApplied);
  if (hasReplacedItems) {
    return {
      success: false,
      error:
        "Order has already been processed with replacements and cannot be modified",
    };
  }

  const member = await prisma.member.findFirst({
    where: { userId: session.user.id },
  });

  if (!member) {
    return { success: false, error: "Organization not found" };
  }

  if (items.length === 0) {
    await prisma.$transaction(async (tx) => {
      await tx.orderItem.deleteMany({ where: { orderId } });
      await tx.order.delete({
        where: { id: orderId },
      });
      if (order.orderWindow.winnerUserId === order.userId) {
        await tx.orderWindow.update({
          where: { id: order.windowId },
          data: { winnerUserId: null },
        });
      }
    });

    await notify({
      type: "order_cancelled",
      orgId: member.organizationId,
      payload: { orderId },
    });

    expireOrgData(member.organizationId, "orders");
    revalidatePath("/order-window");
    return { success: true, orderId: order.id };
  }

  const itemsError = await validateOrderItems(
    order.organizationId,
    order.windowId,
    items,
    { requireAvailable: true },
  );
  if (itemsError) {
    return { success: false, error: itemsError };
  }

  // replace all items in a transaction
  await prisma.$transaction(async (tx) => {
    // Delete many cascades and automatically deletes orderItemReplacements
    await tx.orderItem.deleteMany({ where: { orderId } });

    await createOrderItems(tx, orderId, items, session.user.id);

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

  expireOrgData(member.organizationId, "orders");
  revalidatePath("/order-window");
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

  expireOrgData(member.organizationId, "orders");
  revalidatePath("/order-window");
  return { success: true, orderId: order.id };
}

export async function updateOrderStatusAction(
  orderId: string,
  status: "approved" | "rejected" | "pending" | "cancelled",
): Promise<ActionResult> {
  const { session } = await requireAdmin();

  if (!["approved", "rejected", "pending", "cancelled"].includes(status)) {
    return { success: false, error: "Invalid status" };
  }

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

  if (!order || order.organizationId !== member.organizationId) {
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

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: {
        id: orderId,
      },
      data: {
        status,
      },
    });

    if (status === "rejected" || status === "cancelled") {
      const window = await tx.orderWindow.findUnique({
        where: { id: order.windowId },
      });
      if (window?.winnerUserId === order.userId) {
        await tx.orderWindow.update({
          where: { id: order.windowId },
          data: { winnerUserId: null },
        });
      }
    }
  });

  await notify({
    type: "order_status_changed",
    orgId: member.organizationId,
    payload: {
      orderId,
      status,
    },
  });

  expireOrgData(member.organizationId, "orders");
  revalidatePath("/admin/order-window");
  revalidatePath("/admin/dashboard");

  return {
    success: true,
    orderId,
  };
}

// Approves every pending order of one of the admin's windows at once
export async function approvePendingOrdersAction(
  windowId: string,
): Promise<{ success: true; count: number } | { success: false; error: string }> {
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

  const pendingOrders = await prisma.order.findMany({
    where: {
      windowId,
      organizationId: member.organizationId,
      status: "pending",
    },
    select: { id: true },
  });

  const orderIds = pendingOrders.map((order) => order.id);
  if (orderIds.length === 0) {
    return { success: true, count: 0 };
  }

  await prisma.order.updateMany({
    where: {
      id: { in: orderIds },
      status: "pending",
    },
    data: {
      status: "approved",
    },
  });

  await Promise.all(
    orderIds.map((orderId) =>
      notify({
        type: "order_status_changed",
        orgId: member.organizationId,
        payload: {
          orderId,
          status: "approved",
        },
      }),
    ),
  );

  expireOrgData(member.organizationId, "orders");
  revalidatePath("/admin/order-window");
  revalidatePath("/admin/dashboard");

  return { success: true, count: orderIds.length };
}

export async function updateAdminOrderAction(
  orderId: string,
  input: {
    menuItemId: string;
    quantity: number;
    splitUserIds?: string[];
  }[],
): Promise<ActionResult> {
  const { session } = await requireAdmin();

  const parsed = orderItemsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }

  const items = parsed.data;

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

  if (!order || order.organizationId !== member.organizationId) {
    return {
      success: false,
      error: "Order not found",
    };
  }

  if (order.status === "cancelled") {
    return {
      success: false,
      error: "Cancelled orders cannot be edited",
    };
  }

  if (items.length === 0) {
    await prisma.$transaction(async (tx) => {
      await tx.orderItem.deleteMany({ where: { orderId } });
      await tx.order.delete({
        where: { id: orderId },
      });
      const window = await tx.orderWindow.findUnique({
        where: { id: order.windowId },
      });
      if (window?.winnerUserId === order.userId) {
        await tx.orderWindow.update({
          where: { id: order.windowId },
          data: { winnerUserId: null },
        });
      }
    });

    expireOrgData(member.organizationId, "orders");
    return {
      success: true,
      orderId,
    };
  }

  // items already on the order stay editable even if their shop isn't
  // linked to the window (orders from before shops were enforced)
  const existingItems = await prisma.orderItem.findMany({
    where: { orderId },
    select: { menuItemId: true },
  });

  const itemsError = await validateOrderItems(
    order.organizationId,
    order.windowId,
    items,
    {
      requireAvailable: false,
      allowMenuItemIds: existingItems.map((item) => item.menuItemId),
    },
  );
  if (itemsError) {
    return { success: false, error: itemsError };
  }

  await prisma.$transaction(async (tx) => {
    await tx.orderItem.deleteMany({
      where: {
        orderId,
        replacementApplied: false,
      },
    });

    await createOrderItems(tx, orderId, items, order.userId);

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

  expireOrgData(member.organizationId, "orders");
  revalidatePath("/admin/order-window");
  revalidatePath("/admin/history");
  revalidatePath("/admin/dashboard");
  revalidatePath("/order-window");
  revalidatePath("/dashboard");

  return {
    success: true,
    orderId,
  };
}

export async function applyReplacementAction(
  orderItemId: string,
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

  const orderItem = await prisma.orderItem.findUnique({
    where: {
      id: orderItemId,
    },
    include: {
      order: true,
      replacementPreferences: {
        include: {
          menuItem: true,
        },
      },
    },
  });

  if (!orderItem || orderItem.order.organizationId !== member.organizationId) {
    return {
      success: false,
      error: "Order item not found",
    };
  }

  if (orderItem.replacementApplied) {
    return {
      success: false,
      error: "Replacement has already been applied",
    };
  }

  if (
    !orderItem.replacementPreferences ||
    orderItem.replacementPreferences.length === 0
  ) {
    return {
      success: false,
      error: "No replacements configured for this item",
    };
  }

  await prisma.$transaction(async (tx) => {
    // 1. Mark original item as replaced
    await tx.orderItem.update({
      where: {
        id: orderItemId,
      },
      data: {
        replacementApplied: true,
        replacementAppliedAt: new Date(),
        replacementAppliedById: session.user.id,
      },
    });

    // 2. Create the replacement order items
    for (const pref of orderItem.replacementPreferences) {
      await tx.orderItem.create({
        data: {
          id: nanoid(),
          orderId: orderItem.orderId,
          menuItemId: pref.menuItemId,
          quantity: pref.quantity,
          originalOrderItemId: orderItemId,
        },
      });
    }

    // 3. Update order timestamp
    await tx.order.update({
      where: {
        id: orderItem.orderId,
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
      orderId: orderItem.orderId,
    },
  });

  expireOrgData(member.organizationId, "orders");
  revalidatePath("/admin/order-window");
  revalidatePath("/admin/dashboard");
  revalidatePath("/order-window");
  revalidatePath("/history");

  return {
    success: true,
    orderId: orderItem.orderId,
  };
}

export async function getActiveMenuItemsAction() {
  const session = await authIsRequired();
  const member = await prisma.member.findFirst({
    where: { userId: session.user.id },
  });
  if (!member) {
    return { success: false, error: "Member not found" };
  }
  const items = await prisma.menuItem.findMany({
    where: {
      organizationId: member.organizationId,
      isAvailable: true,
    },
    include: {
      menuCategory: true,
      shop: true,
    },
    orderBy: { name: "asc" },
  });
  return {
    success: true,
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price.toString(),
      unit: item.unit,
      menuCategoryName: item.menuCategory.name,
      shopName: item.shop?.name || null,
      isGroupOrderEnabled: item.shop?.isGroupOrderEnabled ?? false,
    })),
  };
}

const createLateOrderSchema = z.object({
  windowId: z.string().min(1),
  userId: z.string().min(1),
  items: z.array(orderItemSchema).min(1, "Add at least one item"),
});

export type CreateLateOrderInput = z.infer<typeof createLateOrderSchema>;

export async function createLateOrderAction(
  input: CreateLateOrderInput,
): Promise<ActionResult> {
  const { session } = await requireAdmin();

  const parsed = createLateOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }

  const { windowId, userId, items } = parsed.data;

  const member = await prisma.member.findFirst({
    where: { userId: session.user.id },
  });

  if (!member) {
    return { success: false, error: "Organization not found" };
  }

  const lateWindow = await prisma.orderWindow.findFirst({
    where: { id: windowId, organizationId: member.organizationId },
    select: { id: true },
  });

  if (!lateWindow) {
    return { success: false, error: "Order window not found" };
  }

  const targetMember = await prisma.member.findFirst({
    where: { userId, organizationId: member.organizationId },
    select: { id: true },
  });

  if (!targetMember) {
    return { success: false, error: "User is not a member of your organization" };
  }

  // check if user already has an order in this window
  const existingOrder = await prisma.order.findFirst({
    where: {
      windowId,
      userId: userId,
      status: { not: "cancelled" },
    },
  });

  if (existingOrder) {
    return {
      success: false,
      error: "User already has an order for this window.",
    };
  }

  const itemsError = await validateOrderItems(
    member.organizationId,
    windowId,
    items,
    { requireAvailable: false },
  );
  if (itemsError) {
    return { success: false, error: itemsError };
  }

  // create order + items in a transaction
  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        id: nanoid(),
        organizationId: member.organizationId,
        userId: userId,
        windowId,
        status: "approved", // auto-approve late orders by admin
        updatedAt: new Date(),
        createdByAdmin: true,
        createdByUserId: session.user.id,
      },
    });

    await createOrderItems(tx, newOrder.id, items, userId);

    const window = await tx.orderWindow.findUnique({ where: { id: windowId } });
    if (window?.originalWinnerUserId === userId && !window?.winnerUserId) {
      await tx.orderWindow.update({
        where: { id: windowId },
        data: { winnerUserId: userId },
      });
    }

    return newOrder;
  });

  await notify({
    type: "order_placed",
    orgId: member.organizationId,
    payload: {
      orderId: order.id,
      userId: userId,
      userName: "Late Order (Admin)",
    },
  });

  expireOrgData(member.organizationId, "orders");
  revalidatePath("/admin/order-window");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/history");
  return { success: true, orderId: order.id };
}

export async function getEligibleUsersForLateOrderAction(windowId: string) {
  const { session } = await requireAdmin();

  const member = await prisma.member.findFirst({
    where: { userId: session.user.id },
  });

  if (!member) {
    return { success: false, error: "Organization not found" };
  }

  const members = await prisma.member.findMany({
    where: {
      organizationId: member.organizationId,
      role: "member", // exclude admins and owners
      user: {
        orders: {
          none: {
            windowId,
            status: {
              not: "cancelled",
            },
          },
        },
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      user: {
        name: "asc",
      },
    },
  });

  return { success: true, users: members.map((m) => m.user) };
}

const createOrderOnBehalfSchema = z.object({
  windowId: z.string().min(1),
  userId: z.string().min(1),
  items: z.array(orderItemSchema).min(1, "Add at least one item"),
});

export type CreateOrderOnBehalfInput = z.infer<typeof createOrderOnBehalfSchema>;

export async function createOrderOnBehalfAction(
  input: CreateOrderOnBehalfInput,
): Promise<ActionResult> {
  const { session } = await requireAdmin();

  const parsed = createOrderOnBehalfSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }

  const { windowId, userId, items } = parsed.data;

  const member = await prisma.member.findFirst({
    where: { userId: session.user.id },
  });

  if (!member) {
    return { success: false, error: "Organization not found" };
  }

  const window = await prisma.orderWindow.findUnique({
    where: { id: windowId },
  });

  if (!window || window.status !== "active") {
    return { success: false, error: "Order window is no longer active" };
  }

  if (window.organizationId !== member.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  if (window.endsAt && window.endsAt < new Date()) {
    await closeWindowInternal(windowId);
    expireOrgData(member.organizationId, "orders");
    return { success: false, error: "Order window has expired" };
  }

  const targetMember = await prisma.member.findFirst({
    where: { userId, organizationId: member.organizationId },
    include: { user: true },
  });

  if (!targetMember) {
    return { success: false, error: "User is not a member of your organization" };
  }

  const existingOrder = await prisma.order.findFirst({
    where: {
      windowId,
      userId,
      status: { not: "cancelled" },
    },
  });

  if (existingOrder) {
    return {
      success: false,
      error: `${targetMember.user.name} already has an order for this window.`,
    };
  }

  const itemsError = await validateOrderItems(
    member.organizationId,
    windowId,
    items,
    { requireAvailable: false },
  );
  if (itemsError) {
    return { success: false, error: itemsError };
  }

  let order;
  try {
    order = await prisma.$transaction(async (tx) => {
      const currentWindow = await tx.orderWindow.findUnique({
        where: { id: windowId },
      });

      if (!currentWindow || currentWindow.status !== "active") {
        throw new Error("Order window is no longer active");
      }

      const newOrder = await tx.order.create({
        data: {
          id: nanoid(),
          organizationId: member.organizationId,
          userId,
          windowId,
          status: "approved",
          updatedAt: new Date(),
          createdByAdmin: true,
          createdByUserId: session.user.id,
        },
      });

      await createOrderItems(tx, newOrder.id, items, userId);

      return newOrder;
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }

  await notify({
    type: "order_placed",
    orgId: member.organizationId,
    payload: {
      orderId: order.id,
      userId,
      userName: `${targetMember.user.name} (by Admin)`,
    },
  });

  expireOrgData(member.organizationId, "orders");
  revalidatePath("/admin/order-window");
  revalidatePath("/admin/dashboard");
  revalidatePath("/(user)/order-window");
  revalidatePath("/(user)/dashboard");
  return { success: true, orderId: order.id };
}

export async function getEligibleUsersForActiveWindowAction(windowId: string) {
  const { session } = await requireAdmin();

  const member = await prisma.member.findFirst({
    where: { userId: session.user.id },
  });

  if (!member) {
    return { success: false, error: "Organization not found" };
  }

  const members = await prisma.member.findMany({
    where: {
      organizationId: member.organizationId,
      user: {
        orders: {
          none: {
            windowId,
            status: {
              not: "cancelled",
            },
          },
        },
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      user: {
        name: "asc",
      },
    },
  });

  return { success: true, users: members.map((m) => m.user) };
}

export async function getOrganizationMembersForSplitAction(
  excludeUserId?: string,
) {
  const session = await authIsRequired();

  const member = await prisma.member.findFirst({
    where: { userId: session.user.id },
  });

  if (!member) {
    return { success: false, error: "Organization not found" };
  }

  const excludedUserIds = [session.user.id];
  if (excludeUserId && !excludedUserIds.includes(excludeUserId)) {
    excludedUserIds.push(excludeUserId);
  }

  const members = await prisma.member.findMany({
    where: {
      organizationId: member.organizationId,
      userId: { notIn: excludedUserIds },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      user: {
        name: "asc",
      },
    },
  });

  return { success: true, users: members.map((m) => m.user) };
}

export async function getUserActiveSharedSplitsAction() {
  const session = await authIsRequired();

  const member = await prisma.member.findFirst({
    where: { userId: session.user.id },
  });

  if (!member) {
    return { success: false, error: "Member not found" };
  }

  const activeWindow = await prisma.orderWindow.findFirst({
    where: {
      organizationId: member.organizationId,
      status: "active",
    },
  });

  if (!activeWindow) {
    return { success: true, splits: [] };
  }

  const splits = await prisma.orderItemSplit.findMany({
    where: {
      userId: session.user.id,
      orderItem: {
        order: {
          windowId: activeWindow.id,
          status: { not: "cancelled" },
        },
      },
    },
    include: {
      orderItem: {
        include: {
          menuItem: true,
          order: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
          splits: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    success: true,
    splits: splits.map((split) => {
      const item = split.orderItem;
      const participantCount = item.splits.length + 1;
      const itemTotal = Number(item.menuItem.price) * item.quantity;
      const userShare = itemTotal / participantCount;

      return {
        id: split.id,
        orderId: item.order.id,
        orderStatus: item.order.status,
        initiatorName: item.order.user.name,
        menuItemId: item.menuItemId,
        name: item.menuItem.name,
        unitPrice: item.menuItem.price.toString(),
        quantity: item.quantity,
        participantCount,
        splitFraction: `1/${participantCount}`,
        userShare,
        coSplitterNames: item.splits
          .filter((s) => s.userId !== session.user.id)
          .map((s) => s.user.name),
      };
    }),
  };
}

type OrderItemInput = PlaceOrderInput["items"][number];

// Menu items must belong to the org and to the shops the window was opened
// with (and be available when required); split users must be org members
async function validateOrderItems(
  organizationId: string,
  windowId: string,
  items: OrderItemInput[],
  {
    requireAvailable,
    allowMenuItemIds = [],
  }: { requireAvailable: boolean; allowMenuItemIds?: string[] },
): Promise<string | null> {
  const menuItemIds = [
    ...new Set(
      items.flatMap((item) => [
        item.menuItemId,
        ...(item.replacements ?? []).map((rep) => rep.menuItemId),
      ]),
    ),
  ];

  const [menuItems, window] = await Promise.all([
    prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, organizationId },
      select: {
        id: true,
        name: true,
        isAvailable: true,
        shopId: true,
        shop: { select: { isGroupOrderEnabled: true } },
      },
    }),
    prisma.orderWindow.findUnique({
      where: { id: windowId },
      select: { shops: { select: { id: true } } },
    }),
  ]);

  if (menuItems.length !== menuItemIds.length) {
    return "Menu item not found";
  }

  // older windows without linked shops allow every shop
  const windowShopIds = new Set(window?.shops.map((shop) => shop.id) ?? []);
  if (windowShopIds.size > 0) {
    const allowed = new Set(allowMenuItemIds);
    const outsideWindow = menuItems.find(
      (menuItem) =>
        !allowed.has(menuItem.id) &&
        !(menuItem.shopId && windowShopIds.has(menuItem.shopId)),
    );
    if (outsideWindow) {
      return `${outsideWindow.name} isn't from a shop in this order window`;
    }
  }

  if (requireAvailable) {
    const orderedIds = new Set(items.map((item) => item.menuItemId));
    const unavailable = menuItems.find(
      (menuItem) => orderedIds.has(menuItem.id) && !menuItem.isAvailable,
    );
    if (unavailable) {
      return `${unavailable.name} is no longer available`;
    }

    // only shops that take group orders can have an item split; admins
    // editing older orders keep the splits those orders already have
    const splitNotAllowed = menuItems.find(
      (menuItem) =>
        !menuItem.shop?.isGroupOrderEnabled &&
        items.some(
          (item) =>
            item.menuItemId === menuItem.id &&
            (item.splitUserIds ?? []).length > 0,
        ),
    );
    if (splitNotAllowed) {
      return `${splitNotAllowed.name}'s shop doesn't take group orders, so it can't be split`;
    }
  }

  const splitUserIds = [
    ...new Set(items.flatMap((item) => item.splitUserIds ?? []).filter(Boolean)),
  ];

  if (splitUserIds.length > 0) {
    const splitMemberCount = await prisma.member.count({
      where: { organizationId, userId: { in: splitUserIds } },
    });
    if (splitMemberCount !== splitUserIds.length) {
      return "Split user not found";
    }
  }

  return null;
}

// Helper to DRY order item creation
async function createOrderItems(
  tx: Prisma.TransactionClient,
  orderId: string,
  items: OrderItemInput[],
  ownerUserId: string,
) {
  for (const item of items) {
    const orderItemId = nanoid();
    await tx.orderItem.create({
      data: {
        id: orderItemId,
        orderId,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
      },
    });

    if (item.splitUserIds && item.splitUserIds.length > 0) {
      // the owner is always a participant, never one of their own splitters
      const uniqueSplitUserIds = Array.from(
        new Set(
          item.splitUserIds.filter((id) => id && id !== ownerUserId),
        ),
      );
      if (uniqueSplitUserIds.length > 0) {
        const totalParticipants = uniqueSplitUserIds.length + 1;
        const shareRatio = 1 / totalParticipants;

        await tx.orderItemSplit.createMany({
          data: uniqueSplitUserIds.map((userId) => ({
            id: nanoid(),
            orderItemId,
            userId,
            shareRatio,
            status: "accepted",
          })),
        });
      }
    }

    if (item.replacements && item.replacements.length > 0) {
      await tx.orderItemReplacement.createMany({
        data: item.replacements.map((rep) => ({
          id: nanoid(),
          orderItemId,
          menuItemId: rep.menuItemId,
          quantity: rep.quantity,
        })),
      });
    }
  }
}

export async function bulkDeleteOrderItemFromWindowAction(
  windowId: string,
  menuItemId: string,
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

  const orderWindow = await prisma.orderWindow.findUnique({
    where: { id: windowId },
  });

  if (!orderWindow || orderWindow.organizationId !== member.organizationId) {
    return { success: false, error: "Order window not found" };
  }

  // Find all order items to delete
  const orderItemsToDelete = await prisma.orderItem.findMany({
    where: {
      menuItemId: menuItemId,
      order: {
        windowId: windowId,
        status: { not: "cancelled" },
      },
    },
    include: {
      order: true,
    },
  });

  if (orderItemsToDelete.length === 0) {
    return { success: false, error: "No orders found with this item" };
  }

  const orderIds = [...new Set(orderItemsToDelete.map((oi) => oi.orderId))];

  await prisma.$transaction(async (tx) => {
    // 1. Delete the order items
    await tx.orderItem.deleteMany({
      where: {
        menuItemId: menuItemId,
        order: {
          windowId: windowId,
          status: { not: "cancelled" },
        },
      },
    });

    // 2. Check if any affected orders now have 0 items
    for (const orderId of orderIds) {
      const remainingItems = await tx.orderItem.count({
        where: { orderId },
      });

      if (remainingItems === 0) {
        const order = await tx.order.findUnique({ where: { id: orderId } });
        if (order) {
          await tx.order.delete({
            where: { id: orderId },
          });
          const window = await tx.orderWindow.findUnique({
            where: { id: order.windowId },
          });
          if (window?.winnerUserId === order.userId) {
            await tx.orderWindow.update({
              where: { id: order.windowId },
              data: { winnerUserId: null },
            });
          }
        }

        await notify({
          type: "order_cancelled",
          orgId: member.organizationId,
          payload: { orderId },
        });
      } else {
        await tx.order.update({
          where: { id: orderId },
          data: { updatedAt: new Date() },
        });

        await notify({
          type: "order_updated",
          orgId: member.organizationId,
          payload: { orderId },
        });
      }
    }
  });

  expireOrgData(member.organizationId, "orders");
  revalidatePath("/admin/history");
  revalidatePath("/admin/order-window");
  revalidatePath("/admin/dashboard");

  return { success: true, orderId: "bulk-delete" };
}

export async function bulkUpdateOrderItemAction(
  windowId: string,
  menuItemId: string,
  updates: { orderId: string; newQuantity: number }[],
): Promise<ActionResult> {
  const { session } = await requireAdmin();

  if (
    !updates.every(
      (update) =>
        Number.isInteger(update.newQuantity) && update.newQuantity >= 0,
    )
  ) {
    return { success: false, error: "Invalid quantity" };
  }

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

  const orderWindow = await prisma.orderWindow.findUnique({
    where: { id: windowId },
  });

  if (!orderWindow || orderWindow.organizationId !== member.organizationId) {
    return { success: false, error: "Order window not found" };
  }

  await prisma.$transaction(async (tx) => {
    for (const update of updates) {
      const { orderId, newQuantity } = update;

      const currentItems = await tx.orderItem.findMany({
        where: {
          orderId: orderId,
          menuItemId: menuItemId,
          order: { windowId },
        },
        orderBy: { createdAt: "asc" },
      });

      if (currentItems.length === 0) {
        continue; // Not an order in this window with this item
      }

      const currentQuantity = currentItems.reduce(
        (acc, item) => acc + item.quantity,
        0,
      );

      if (newQuantity === currentQuantity) {
        continue; // No change for this user
      }

      if (newQuantity === 0) {
        // Delete all matching items for this order
        await tx.orderItem.deleteMany({
          where: {
            orderId: orderId,
            menuItemId: menuItemId,
          },
        });
      } else {
        // Adjust quantities, preserving rows where possible
        let remainingToKeep = newQuantity;
        for (const item of currentItems) {
          if (remainingToKeep >= item.quantity) {
            remainingToKeep -= item.quantity;
          } else if (remainingToKeep > 0) {
            await tx.orderItem.update({
              where: { id: item.id },
              data: { quantity: remainingToKeep },
            });
            remainingToKeep = 0;
          } else {
            await tx.orderItem.delete({
              where: { id: item.id },
            });
          }
        }
      }

      // Check if order is empty
      const remainingItems = await tx.orderItem.count({
        where: { orderId },
      });

      if (remainingItems === 0) {
        await tx.order.update({
          where: { id: orderId },
          data: { status: "cancelled", updatedAt: new Date() },
        });

        await notify({
          type: "order_cancelled",
          orgId: member.organizationId,
          payload: { orderId },
        });
      } else {
        await tx.order.update({
          where: { id: orderId },
          data: { updatedAt: new Date() },
        });

        await notify({
          type: "order_updated",
          orgId: member.organizationId,
          payload: { orderId },
        });
      }
    }
  });

  expireOrgData(member.organizationId, "orders");
  revalidatePath("/admin/history");
  revalidatePath("/admin/order-window");
  revalidatePath("/admin/dashboard");

  return { success: true, orderId: "bulk-update" };
}
