import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { authIsRequired, getCurrentMember } from "@/actions/user";
import { StravaPage } from "@/components/strava/StravaPage";
import { isAdminRole } from "@/modules/strava/paths";

export const metadata: Metadata = {
  title: "Strava",
  description: "Connect Strava and see your runs and run score.",
};

interface Props {
  searchParams: Promise<{ error?: string; connected?: string }>;
}

export default async function UserStravaPage({ searchParams }: Props) {
  const session = await authIsRequired();
  const member = await getCurrentMember();
  if (!member) redirect("/");
  if (isAdminRole(member.role)) redirect("/admin/runs");

  const params = await searchParams;
  return (
    <StravaPage
      userId={session.user.id}
      organizationId={member.organizationId}
      error={params.error}
      connected={params.connected === "1"}
    />
  );
}
