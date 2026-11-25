import { SnackySummaryCard } from "@/app/admin/dashboard/_components/SnackySummaryCard";
import { boardKey } from "@/modules/snacky/run-facts";
import { getSavedSnackySummary, refreshSnackySummary } from "@/modules/snacky/summary";
import type { RunsLeaderboard } from "@/modules/strava/leaderboard";

// Snacky's roast of a day's runs board, saved per org and day. It is written
// the first time someone opens the day, and again once the board has changed
// (a new run, or the lock), so it never roasts an old board.
export async function RunsRoast({
  organizationId,
  leaderboard,
  label,
}: {
  organizationId: string;
  leaderboard: RunsLeaderboard;
  label: string; // "Tue 24 Nov"
}) {
  const day = leaderboard.day;
  let summary = await getSavedSnackySummary(organizationId, day, "runs");
  let error: string | undefined;
  if (!summary || summary.board !== boardKey(leaderboard)) {
    try {
      summary = await refreshSnackySummary(organizationId, day, "runs");
    } catch (e) {
      console.error("Snacky runs roast failed", e);
      error = "Snacky couldn't roast the runs just now";
    }
  }

  return (
    <SnackySummaryCard
      variant='runs'
      period={day}
      periodLabel={label}
      initial={summary}
      initialError={error}
    />
  );
}
