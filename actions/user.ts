"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import type { Session } from "@/lib/auth/auth";

// nullable session
export async function authSession(): Promise<Session | null> {
  return await auth.api.getSession({
    headers: await headers(),
  });
}

// must be logged in or redirects to /login
export async function authIsRequired() {
  const session = await authSession();
  if (!session) redirect("/login");
  return session;
}

// must NOT be logged in or redirects to /
// use in login and register page
export async function authIsNotRequired() {
  const session = await authSession();
  if (!session) return;
  if (session.user.role === "super_admin") redirect("/super-admin/dashboard");
  if (session.user.role === "admin") redirect("/admin/dashboard");
  redirect("/dashboard");
}

// org-level member
export async function getCurrentMember() {
  return await auth.api.getActiveMember({
    headers: await headers(),
  });
}

// must be admin or owner in org
export async function requireAdmin() {
  const session = await authIsRequired();
  const member = await getCurrentMember();
  if (!member || (member.role !== "admin" && member.role !== "owner")) {
    redirect("/");
  }
  return { session, member };
}

// must have global super_admin role
export async function requireSuperAdmin() {
  const session = await authIsRequired();
  if (session.user.role !== "super_admin") redirect("/");
  return session;
}
