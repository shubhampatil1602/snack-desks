"use server";

import { prisma } from "@/lib/db";
import { canManageUser } from "@/lib/auth/manage-user";
import { expireOrgData } from "@/lib/cache-tags";
import { revalidatePath } from "next/cache";

export async function deleteUserAction(userId: string) {
  try {
    const access = await canManageUser(userId);
    if (!access.success) {
      return access;
    }

    if (access.actorId === userId) {
      return {
        success: false,
        error: "You cannot delete yourself",
      };
    }

    // their orders are deleted with them, so these orgs' numbers change
    const memberships = await prisma.member.findMany({
      where: { userId },
      select: { organizationId: true },
    });

    await prisma.user.delete({
      where: {
        id: userId,
      },
    });

    memberships.forEach(({ organizationId }) =>
      expireOrgData(organizationId, "orders", "members"),
    );

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
