"use server";

import { prisma } from "@/lib/db";
import { authIsRequired } from "@/actions/user";
import { revalidatePath } from "next/cache";

export async function deleteUserAction(userId: string) {
  try {
    const session = await authIsRequired();

    if (session.user.role !== "admin" && session.user.role !== "super_admin") {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    if (session.user.id === userId) {
      return {
        success: false,
        error: "You cannot delete yourself",
      };
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    if (user.role === "super_admin") {
      return {
        success: false,
        error: "Super admin cannot be deleted",
      };
    }

    await prisma.user.delete({
      where: {
        id: userId,
      },
    });

    revalidatePath("/admin/users");
    revalidatePath("/super-admin/users");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Delete user error:", error);

    return {
      success: false,
      error: "Failed to delete user",
    };
  }
}
