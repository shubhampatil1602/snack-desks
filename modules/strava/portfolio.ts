// The owner's portfolio shows their Strava (it borrows the token from
// /api/strava/share-token) and keeps it for an hour. When the shared
// athlete's Strava changes, tell it to fetch again right away.
export async function refreshPortfolio(athleteId: number) {
  const { PORTFOLIO_STRAVA_REFRESH_URL: url, STRAVA_SHARE_SECRET: secret } = process.env;
  if (!url || !secret || String(athleteId) !== process.env.STRAVA_SHARE_ATHLETE_ID) return;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) console.error("Portfolio Strava refresh failed", res.status);
  } catch (e) {
    console.error("Portfolio Strava refresh failed", e);
  }
}
