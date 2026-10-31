import { prisma } from "@/lib/db";
import { authIsRequired, getCurrentMember } from "@/actions/user";

type ManageUserResult =
  | { success: true; actorId: string }
  | { success: false; error: string };

// Super admins can manage any user except other super admins.
// Org admins can manage only members of their own org, never its owner.
export async function canManageUser(
  targetUserId: string,
): Promise<ManageUserResult> {
  const session = await authIsRequired();

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, role: true },
  });

  if (!target) {
    return { success: false, error: "User not found" };
  }

  if (target.role === "super_admin") {
    return { success: false, error: "Super admin cannot be modified" };
  }

  if (session.user.role === "super_admin") {
    return { success: true, actorId: session.user.id };
  }

  const member = await getCurrentMember();
  if (!member || (member.role !== "admin" && member.role !== "owner")) {
    return { success: false, error: "Unauthorized" };
  }

  const targetMember = await prisma.member.findFirst({
    where: { userId: targetUserId, organizationId: member.organizationId },
    select: { role: true },
  });

  if (!targetMember) {
    return { success: false, error: "User not found" };
  }

  if (targetMember.role === "owner") {
    return {
      success: false,
      error: "The organization owner cannot be modified",
    };
  }

  return { success: true, actorId: session.user.id };
}
