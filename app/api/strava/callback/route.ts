import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { subDays } from "date-fns";

import { authSession } from "@/actions/user";
import { prisma } from "@/lib/db";
import {
  athletePhoto,
  exchangeCode,
  STRAVA_CAPACITY,
} from "@/lib/strava/api";
import { importActivitiesSince } from "@/modules/strava/sync";
import { STRAVA_OAUTH_COOKIE, STRAVA_PAGE } from "@/modules/strava/paths";

// Strava sends the user back here after the consent screen
// (connectStravaAction sent them there).
export async function GET(request: Request) {
  const url = new URL(request.url);
  const cookieStore = await cookies();
  const raw = cookieStore.get(STRAVA_OAUTH_COOKIE)?.value;
  cookieStore.delete({ name: STRAVA_OAUTH_COOKIE, path: "/api/strava" });

  let saved: {
    state: string;
    userId: string;
    consentedAt: string;
  } | null = null;
  try {
    saved = raw ? JSON.parse(raw) : null;
  } catch {
    saved = null;
  }

  const back = (query: string) =>
    NextResponse.redirect(
      new URL(`${STRAVA_PAGE}?${query}`, url.origin),
    );

  const session = await authSession();
  if (!session) return NextResponse.redirect(new URL("/login", url.origin));

  if (
    !saved ||
    saved.state !== url.searchParams.get("state") ||
    saved.userId !== session.user.id
  ) {
    return back("error=expired");
  }

  // they pressed Cancel on Strava's page
  if (url.searchParams.get("error")) return back("error=denied");

  // Strava lets people untick scopes; without this one, private runs are missed
  const granted = url.searchParams.get("scope")?.split(",") ?? [];
  if (!granted.includes("activity:read_all")) return back("error=scope");

  const code = url.searchParams.get("code");
  if (!code) return back("error=expired");

  let token;
  try {
    token = await exchangeCode(code);
  } catch (e) {
    console.error(e);
    return back("error=strava");
  }
  if (!token.athlete) return back("error=strava");

  const athleteId = BigInt(token.athlete.id);
  const [linkedElsewhere, taken] = await Promise.all([
    prisma.stravaConnection.findFirst({
      where: { athleteId, userId: { not: session.user.id } },
      select: { userId: true },
    }),
    prisma.stravaConnection.count({
      where: { userId: { not: session.user.id } },
    }),
  ]);
  if (linkedElsewhere) return back("error=taken");
  if (taken >= STRAVA_CAPACITY) return back("error=full");

  const data = {
    athleteId,
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresAt: new Date(token.expires_at * 1000),
    scope: granted.join(","),
    firstName: token.athlete.firstname ?? null,
    lastName: token.athlete.lastname ?? null,
    photoUrl: athletePhoto(token.athlete),
    consentedAt: new Date(saved.consentedAt),
  };
  await prisma.stravaConnection.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...data },
    update: data,
  });

  // fill the charts straight away
  await importActivitiesSince(session.user.id, subDays(new Date(), 90));

  return back("connected=1");
}
