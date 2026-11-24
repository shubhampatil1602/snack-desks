import { prisma } from "@/lib/db";

// Strava's OAuth and REST API. One Strava app serves every org, and Strava
// caps how many athletes may connect to it (ADR 0002).

const STRAVA = "https://www.strava.com";
const API = `${STRAVA}/api/v3`;

// read: public profile (name, photo). activity:read_all: "Only Me" runs too
export const STRAVA_SCOPE = "read,activity:read_all";

export const STRAVA_CAPACITY = Number(process.env.STRAVA_ATHLETE_CAPACITY) || 10;

export function stravaConfigured() {
  return !!process.env.STRAVA_CLIENT_ID && !!process.env.STRAVA_CLIENT_SECRET;
}

export function stravaRedirectUri() {
  const base = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/api/strava/callback`;
}

export function stravaAuthorizeUrl(state: string) {
  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID ?? "",
    redirect_uri: stravaRedirectUri(),
    response_type: "code",
    approval_prompt: "auto",
    scope: STRAVA_SCOPE,
    state,
  });
  return `${STRAVA}/oauth/authorize?${params}`;
}

export type StravaAthlete = {
  id: number;
  firstname?: string;
  lastname?: string;
  profile?: string;
  profile_medium?: string;
};

export class StravaAuthError extends Error {}

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_at: number; // seconds since epoch
  athlete?: StravaAthlete;
};

async function tokenRequest(body: Record<string, string>) {
  const res = await fetch(`${STRAVA}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      ...body,
    }),
    cache: "no-store",
  });
  // a refresh token stops working once the athlete removes our access
  if (res.status === 400 || res.status === 401) {
    throw new StravaAuthError(`Strava token request refused: ${res.status}`);
  }
  if (!res.ok) {
    throw new Error(`Strava token request failed: ${res.status}`);
  }
  return (await res.json()) as TokenResponse;
}

export function exchangeCode(code: string) {
  return tokenRequest({ code, grant_type: "authorization_code" });
}

// Strava's default picture is a placeholder path, not a URL
export function athletePhoto(athlete: StravaAthlete) {
  const url = athlete.profile ?? athlete.profile_medium;
  return url?.startsWith("http") ? url : null;
}

/**
 * A working access token for this user, refreshed when it has less than
 * `minValidMs` left. Strava only hands out a new token once the current one
 * has an hour or less left.
 */
export async function accessTokenFor(userId: string, minValidMs = 5 * 60 * 1000) {
  const connection = await prisma.stravaConnection.findUnique({
    where: { userId },
    select: { accessToken: true, refreshToken: true, expiresAt: true },
  });
  if (!connection) return null;

  if (connection.expiresAt.getTime() > Date.now() + minValidMs) {
    return connection.accessToken;
  }

  const token = await tokenRequest({
    grant_type: "refresh_token",
    refresh_token: connection.refreshToken,
  });
  await prisma.stravaConnection.update({
    where: { userId },
    data: {
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt: new Date(token.expires_at * 1000),
    },
  });
  return token.access_token;
}

async function stravaGet<T>(userId: string, path: string): Promise<T | null> {
  const token = await accessTokenFor(userId);
  if (!token) return null;

  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (res.status === 401) throw new StravaAuthError("Strava access revoked");
  if (!res.ok) throw new Error(`Strava GET ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

export type StravaActivityJson = {
  id: number;
  name: string;
  sport_type: string;
  start_date: string; // ISO, UTC
  distance: number; // metres
  moving_time: number; // seconds
  elapsed_time: number; // seconds
  manual: boolean;
};

export function getAthlete(userId: string) {
  return stravaGet<StravaAthlete>(userId, "/athlete");
}

export function getActivity(userId: string, activityId: number | bigint) {
  return stravaGet<StravaActivityJson>(userId, `/activities/${activityId}`);
}

/** The athlete's activities that started after `after`, newest pages first. */
export async function listActivitiesSince(userId: string, after: Date, maxPages = 5) {
  const all: StravaActivityJson[] = [];
  const afterSeconds = Math.floor(after.getTime() / 1000);

  for (let page = 1; page <= maxPages; page++) {
    const batch = await stravaGet<StravaActivityJson[]>(
      userId,
      `/athlete/activities?after=${afterSeconds}&per_page=200&page=${page}`,
    );
    if (!batch || batch.length === 0) break;
    all.push(...batch);
    if (batch.length < 200) break;
  }
  return all;
}

/** Tells Strava to forget our access. Never throws: we delete our side anyway. */
export async function deauthorize(userId: string) {
  try {
    const token = await accessTokenFor(userId);
    if (!token) return;
    await fetch(`${STRAVA}/oauth/deauthorize`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch (e) {
    console.error("Strava deauthorize failed", e);
  }
}
