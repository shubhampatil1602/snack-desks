"use server";

import { cookies } from "next/headers";

const COOKIE_NAME = "preferred-date-filter";

export async function setPeriodCookie(period: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, period, { 
    path: "/", 
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
  });
}

export async function getPeriodCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value || null;
}
