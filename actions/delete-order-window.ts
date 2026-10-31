"use server";

import { expireOrgData } from "@/lib/cache-tags";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/actions/user";
import { revalidatePath } from "next/cache";

export async function deleteOrderWindowAction(windowId: string) {
  try {
    const { member } = await requireAdmin();

    const window = await prisma.orderWindow.findFirst({
      where: {
        id: windowId,
        organizationId: member.organizationId,
      },
      select: {
        id: true,
        label: true,
      },
    });

    if (!window) {
      return {
        success: false,
        error: "Order window not found",
      };
    }

    await prisma.orderWindow.delete({
      where: {
        id: windowId,
      },
    });

    expireOrgData(member.organizationId, "orders");
    revalidatePath("/admin/order-window");
    revalidatePath("/order-window");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Delete order window error:", error);

    return {
      success: false,
      error: "Failed to delete order window",
    };
  }
}

export async function deleteMultipleOrderWindowsAction(windowIds: string[]) {
  try {
    const { member } = await requireAdmin();

    if (!windowIds || windowIds.length === 0) {
      return {
        success: false,
        error: "No windows selected",
      };
    }

    await prisma.orderWindow.deleteMany({
      where: {
        id: { in: windowIds },
        organizationId: member.organizationId,
      },
    });

    expireOrgData(member.organizationId, "orders");
    revalidatePath("/admin/history");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Delete multiple order windows error:", error);

    return {
      success: false,
      error: "Failed to delete order windows",
    };
  }
}
