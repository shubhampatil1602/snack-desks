"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";

import { authIsRequired, getCurrentMember } from "@/actions/user";
import { prisma } from "@/lib/db";
import {
  deauthorize,
  STRAVA_CAPACITY,
  stravaAuthorizeUrl,
  stravaConfigured,
} from "@/lib/strava/api";
import { removeStravaData } from "@/modules/strava/sync";
import { isAdminRole, STRAVA_OAUTH_COOKIE, STRAVA_PAGE } from "@/modules/strava/paths";

// The /strava page's form: the user ticked the consent box and pressed
// "Connect with Strava". Remember the consent and a state value in a cookie,
// then send them to Strava; /api/strava/callback finishes the link.
export async function connectStravaAction(formData: FormData) {
  const session = await authIsRequired();
  const member = await getCurrentMember();
  if (isAdminRole(member?.role)) redirect("/admin/runs");
  const page = STRAVA_PAGE;

  if (formData.get("consent") !== "on") redirect(`${page}?error=consent`);
  if (!stravaConfigured()) redirect(`${page}?error=unavailable`);

  const [connected, taken] = await Promise.all([
    prisma.stravaConnection.findUnique({
      where: { userId: session.user.id },
      select: { userId: true },
    }),
    prisma.stravaConnection.count(),
  ]);
  if (connected) redirect(page);
  if (taken >= STRAVA_CAPACITY) redirect(`${page}?error=full`);

  const state = nanoid(32);
  const cookieStore = await cookies();
  cookieStore.set(
    STRAVA_OAUTH_COOKIE,
    JSON.stringify({
      state,
      userId: session.user.id,
      consentedAt: new Date().toISOString(),
    }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/strava",
      maxAge: 10 * 60,
    },
  );

  redirect(stravaAuthorizeUrl(state));
}

export async function disconnectStravaAction() {
  const session = await authIsRequired();

  await deauthorize(session.user.id);
  await removeStravaData(session.user.id);

  revalidatePath(STRAVA_PAGE, "layout");
  return { success: true };
}
