"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "./user";

export async function toggleRealtime(orgId: string, enabled: boolean) {
  await requireSuperAdmin();

  await prisma.organization.update({
    where: {
      id: orgId,
    },
    data: {
      realtimeEnabled: enabled,
    },
  });

  revalidatePath("/super-admin");
  revalidatePath("/super-admin/manage-org");
}
