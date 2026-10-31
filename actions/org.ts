"use server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "./user";
import { createOrgSchema, type CreateOrgSchema } from "@/types/org";
import { nanoid } from "nanoid";
import { CreateOrgResult } from "@/types/org";
import { hashPassword } from "better-auth/crypto";
import { ActionResult } from "@/types/auth";

export async function createOrgAction(
  input: CreateOrgSchema,
): Promise<CreateOrgResult> {
  await requireSuperAdmin();

  const parsed = createOrgSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }

  const { orgName, orgSlug, adminName, adminEmail, adminPassword } =
    parsed.data;

  const slugTaken = await prisma.organization.findUnique({
    where: { slug: orgSlug },
  });
  if (slugTaken) {
    return { success: false, error: "Organization slug already taken" };
  }

  const emailTaken = await prisma.user.findUnique({
    where: { email: adminEmail },
  });
  if (emailTaken) {
    return { success: false, error: "Admin email is already registered" };
  }

  const inviteCode = nanoid(8).toUpperCase();

  // Create admin user directly via Prisma
  // to avoids signUpEmail which hijacks the current session cookie
  const hashedPassword = await hashPassword(adminPassword);
  const adminId = nanoid();

  const adminUser = await prisma.user.create({
    data: {
      id: adminId,
      name: adminName,
      email: adminEmail,
      emailVerified: false,
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Better Auth stores passwords on the account table, not user
  await prisma.account.create({
    data: {
      id: nanoid(),
      accountId: adminUser.id,
      providerId: "credential",
      userId: adminUser.id,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Create org via Better Auth
  const org = await auth.api.createOrganization({
    body: {
      name: orgName,
      slug: orgSlug,
      userId: adminUser.id,
      inviteCode,
    },
  });

  if (!org) {
    return { success: false, error: "Failed to create organization" };
  }

  return {
    success: true,
    data: {
      orgName: org.name,
      orgSlug: org.slug,
      inviteCode,
      adminEmail,
      adminPassword,
    },
  };
}

export async function deleteOrgAction(orgId: string): Promise<ActionResult> {
  await requireSuperAdmin();

  if (!orgId) return { success: false, error: "Organization ID is required" };

  // 1. get all member userIds in this org
  const members = await prisma.member.findMany({
    where: { organizationId: orgId },
    select: { userId: true },
  });

  const userIds = members.map((m) => m.userId);

  // 2. delete all sessions of all members
  await prisma.session.deleteMany({
    where: { userId: { in: userIds } },
  });

  // 3. delete all accounts (passwords) of all members
  await prisma.account.deleteMany({
    where: { userId: { in: userIds } },
  });

  // 4. delete the org — cascades Member + Invitation records
  await prisma.organization.delete({
    where: { id: orgId },
  });

  // 5. delete all member user records
  await prisma.user.deleteMany({
    where: { id: { in: userIds } },
  });

  return { success: true };
}

export async function getOrganizationById(orgId: string) {
  await requireSuperAdmin();

  return await prisma.organization.findUnique({
    where: { id: orgId },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      _count: {
        select: { members: true },
      },
    },
  });
}

export async function getOrgStats() {
  await requireSuperAdmin();

  const [totalOrgs, totalUsers] = await Promise.all([
    prisma.organization.count(),
    prisma.user.count({
      where: { role: { not: "super_admin" } },
    }),
  ]);

  return { totalOrgs, totalUsers };
}

export async function getRecentOrganizations() {
  await requireSuperAdmin();

  return await prisma.organization.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      members: {
        where: { role: "owner" },
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      },
      _count: {
        select: { members: true },
      },
    },
  });
}
