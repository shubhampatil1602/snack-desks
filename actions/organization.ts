"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function toggleRealtime(orgId: string, enabled: boolean) {
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
