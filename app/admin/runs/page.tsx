import type { Metadata } from "next";

import { requireAdmin } from "@/actions/user";
import { RunsLeaderboardView } from "@/components/strava/RunsLeaderboardView";

export const metadata: Metadata = {
  title: "Runs Leaderboard",
  description: "Who ran best each day. The top runner in a window sits out its spin.",
};

interface Props {
  searchParams: Promise<{ day?: string }>;
}

export default async function AdminRunsLeaderboardPage({ searchParams }: Props) {
  const { member } = await requireAdmin();
  const { day } = await searchParams;

  return (
    <RunsLeaderboardView
      organizationId={member.organizationId}
      basePath='/admin/runs'
      day={day}
    />
  );
}
