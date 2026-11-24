export const STRAVA_OAUTH_COOKIE = "strava_oauth";

// Only employees connect Strava; everyone sees the Runs Leaderboard
export const STRAVA_PAGE = "/strava";

export function isAdminRole(memberRole: string | null | undefined) {
  return memberRole === "admin" || memberRole === "owner";
}
