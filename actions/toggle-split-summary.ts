"use server";

import { expireOrgData } from "@/lib/cache-tags";
import { prisma } from "@/lib/db";
import { requireAdmin } from "./user";
import { revalidatePath } from "next/cache";

export async function toggleSplitSummary(memberId: string, canViewGlobalSplit: boolean) {
  const { member } = await requireAdmin();

  // Ensure the member exists and belongs to the admin's organization
  const targetMember = await prisma.member.findUnique({
    where: {
      id: memberId,
    },
  });

  if (!targetMember || targetMember.organizationId !== member.organizationId) {
    throw new Error("Unauthorized");
  }

  await prisma.member.update({
    where: {
      id: memberId,
    },
    data: {
      canViewGlobalSplit,
    },
  });

  expireOrgData(member.organizationId, "members");
  revalidatePath("/admin/users");
}
