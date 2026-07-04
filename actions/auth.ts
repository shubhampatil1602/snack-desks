"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db";
import {
  ActionResult,
  SignInSchema,
  signInSchema,
  signUpSchema,
  SignUpSchema,
} from "@/types/auth";

export async function signUpAction(
  formData: SignUpSchema,
): Promise<ActionResult> {
  // 1. Validate input
  const parsed = signUpSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }

  const { name, email, password, inviteCode } = parsed.data;

  // 2. Check invite code
  const org = await prisma.organization.findUnique({
    where: { inviteCode: inviteCode.toUpperCase() },
  });
  if (!org) {
    return { success: false, error: "Invalid organization code" };
  }

  // 3. Check email not already taken
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return {
      success: false,
      error: "An account with this email already exists",
    };
  }

  // 4. Create user via Better Auth — session created + cookie set via nextCookies plugin
  const result = await auth.api.signUpEmail({
    body: { name, email, password },
    headers: await headers(),
  });

  if (!result?.user) {
    return {
      success: false,
      error: "Failed to create account. Please try again.",
    };
  }

  // 5. Add user to org as member
  await auth.api.addMember({
    body: {
      userId: result.user.id,
      organizationId: org.id,
      role: "member",
    },
  });

  return { success: true };
}

export async function signInAction(
  formData: SignInSchema,
): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.message,
    };
  }

  const { email, password } = parsed.data;

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!existingUser) {
    return {
      success: false,
      error: "No account found with this email address",
    };
  }

  try {
    await auth.api.signInEmail({
      body: { email, password, rememberMe: true },
      headers: await headers(),
    });

    return { success: true };
  } catch (e: unknown) {
    // Better Auth throws APIError on bad credentials
    const message =
      e instanceof Error ? e.message : "Invalid email or password";
    return { success: false, error: message };
  }
}

export async function signOutAction(): Promise<void> {
  await auth.api.signOut({
    headers: await headers(),
  });
  redirect("/login");
}
