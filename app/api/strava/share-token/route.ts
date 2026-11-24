import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { accessTokenFor } from "@/lib/strava/api";

// Hands one athlete's access token to another app of the same owner (their
// portfolio). Strava keeps one live token per athlete per Strava app, so that
// app asks here instead of keeping a copy that SnackDesk's reconnects would
// break. Only STRAVA_SHARE_ATHLETE_ID is ever shared, and only with
// STRAVA_SHARE_SECRET.

// The caller may cache the token for up to 30 minutes, so it gets at least an
// hour: Strava issues a fresh 6-hour token once an hour or less is left.
const MIN_VALID_MS = 60 * 60 * 1000;

function sameSecret(given: string, expected: string) {
  const hash = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(hash(given), hash(expected));
}

const noStore = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  const secret = process.env.STRAVA_SHARE_SECRET;
  const athleteId = process.env.STRAVA_SHARE_ATHLETE_ID;
  if (!secret || !athleteId || !/^\d+$/.test(athleteId)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const given = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  if (!sameSecret(given, secret)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const connection = await prisma.stravaConnection.findUnique({
    where: { athleteId: BigInt(athleteId) },
    select: { userId: true },
  });
  if (!connection) {
    return NextResponse.json({ error: "not_connected" }, { status: 404, headers: noStore });
  }

  try {
    const token = await accessTokenFor(connection.userId, MIN_VALID_MS);
    if (!token) {
      return NextResponse.json({ error: "not_connected" }, { status: 404, headers: noStore });
    }
    return NextResponse.json({ access_token: token }, { headers: noStore });
  } catch (e) {
    console.error("Strava share token failed", e);
    return NextResponse.json({ error: "strava" }, { status: 502, headers: noStore });
  }
}
