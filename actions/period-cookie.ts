"use server";

import { cookies } from "next/headers";

const COOKIE_NAME = "preferred-date-filter";

export async function setPeriodCookie(period: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, period, { 
    path: "/", 
    sameSite: "lax",
  });
}

export async function getPeriodCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value || null;
}

export async function clearPeriodCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
