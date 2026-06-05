"use server";

import { prisma } from "@/lib/db";
import { authIsRequired } from "@/actions/user";
import { revalidatePath } from "next/cache";

export async function deleteOrderWindowAction(windowId: string) {
  try {
    const session = await authIsRequired();

    if (session.user.role !== "admin" && session.user.role !== "super_admin") {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const window = await prisma.orderWindow.findUnique({
      where: {
        id: windowId,
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
