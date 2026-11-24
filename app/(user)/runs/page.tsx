import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { authIsRequired, getCurrentMember } from "@/actions/user";
import { RunsLeaderboardView } from "@/components/strava/RunsLeaderboardView";
import { isAdminRole, STRAVA_PAGE } from "@/modules/strava/paths";
import { isStravaConnected } from "@/modules/strava/queries";

export const metadata: Metadata = {
  title: "Runs Leaderboard",
  description: "Who ran best each day. The top runner in a window sits out its spin.",
};

interface Props {
  searchParams: Promise<{ day?: string }>;
}

export default async function RunsLeaderboardPage({ searchParams }: Props) {
  const session = await authIsRequired();
  const member = await getCurrentMember();
  if (!member) redirect("/");
  if (isAdminRole(member.role)) redirect("/admin/runs");

  const [{ day }, connected] = await Promise.all([
    searchParams,
    isStravaConnected(session.user.id),
  ]);

  return (
    <RunsLeaderboardView
      organizationId={member.organizationId}
      basePath='/runs'
      day={day}
      viewerId={session.user.id}
      notice={
        connected ? null : (
          <p className='border border-border bg-muted px-4 py-3 text-sm'>
            You&apos;re not on the leaderboard yet.{" "}
            <Link
              href={STRAVA_PAGE}
              className='font-medium underline underline-offset-4'
            >
              Connect Strava
            </Link>{" "}
            to join it.
          </p>
        )
      }
    />
  );
}
