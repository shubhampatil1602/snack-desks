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
  replacements: z
    .array(
      z.object({
        menuItemId: z.string().min(1),
        quantity: z.number().min(1),
      }),
    )
    .optional(),
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

    await createOrderItems(tx, newOrder.id, items);

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

  revalidatePath("/order-window");
  return { success: true, orderId: order.id };
}

export async function updateOrderAction(
  orderId: string,
  items: PlaceOrderInput["items"],
): Promise<ActionResult> {
  const session = await authIsRequired();

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
      await tx.order.update({
        where: { id: orderId },
        data: { status: "cancelled", updatedAt: new Date() },
      });
    });

    await notify({
      type: "order_cancelled",
      orgId: member.organizationId,
      payload: { orderId },
    });

    revalidatePath("/order-window");
    return { success: true, orderId: order.id };
  }

  // replace all items in a transaction
  await prisma.$transaction(async (tx) => {
    // Delete many cascades and automatically deletes orderItemReplacements
    await tx.orderItem.deleteMany({ where: { orderId } });

    await createOrderItems(tx, orderId, items);

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

  revalidatePath("/order-window");
  return { success: true, orderId: order.id };
}

export async function updateOrderStatusAction(
  orderId: string,
  status: "approved" | "rejected" | "pending",
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

  revalidatePath("/admin/order-window");
  revalidatePath("/admin/dashboard");

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
    await prisma.$transaction(async (tx) => {
      await tx.orderItem.deleteMany({ where: { orderId } });
      await tx.order.update({
        where: {
          id: orderId,
        },
        data: {
          status: "cancelled",
          updatedAt: new Date(),
        },
      });
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
        replacementApplied: false,
      },
    });

    for (const item of items) {
      await tx.orderItem.create({
        data: {
          id: nanoid(),
          orderId,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
        },
      });
    }

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

  revalidatePath("/admin/order-window");
  revalidatePath("/admin/dashboard");

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

  if (!orderItem) {
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

    await createOrderItems(tx, newOrder.id, items);

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

// Helper to DRY order item creation
async function createOrderItems(
  tx: any,
  orderId: string,
  items: {
    menuItemId: string;
    quantity: number;
    replacements?: { menuItemId: string; quantity: number }[];
  }[],
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

  if (!orderWindow) {
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

  if (!orderWindow) {
    return { success: false, error: "Order window not found" };
  }

  await prisma.$transaction(async (tx) => {
    for (const update of updates) {
      const { orderId, newQuantity } = update;

      const currentItems = await tx.orderItem.findMany({
        where: {
          orderId: orderId,
          menuItemId: menuItemId,
        },
        orderBy: { createdAt: "asc" },
      });

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

  revalidatePath("/admin/history");
  revalidatePath("/admin/order-window");
  revalidatePath("/admin/dashboard");

  return { success: true, orderId: "bulk-update" };
}
