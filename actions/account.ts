"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { auth } from "@/lib/auth/auth";
import { expireOrgData } from "@/lib/cache-tags";
import { prisma } from "@/lib/db";
import type { ActionResult } from "@/types/auth";

// The Settings window's name change. It runs on the server with the request's
// cookies, the same way sign-in does; Better Auth checks the session itself.

const nameSchema = z.string().trim().min(1, "Enter your name").max(60, "Keep it under 60 characters");

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export async function updateMyNameAction(name: string): Promise<ActionResult> {
  const parsed = nameSchema.safeParse(name);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) return { success: false, error: "Please sign in again" };

  try {
    await auth.api.updateUser({ body: { name: parsed.data }, headers: requestHeaders });
  } catch (error) {
    return { success: false, error: errorMessage(error, "Couldn't save your name") };
  }

  // names show in members, splits, rankings and history
  const memberships = await prisma.member.findMany({
    where: { userId: session.user.id },
    select: { organizationId: true },
  });
  memberships.forEach(({ organizationId }) => expireOrgData(organizationId, "members", "orders"));
  return { success: true };
}
