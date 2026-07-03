import { getEmployeeRankings } from "@/modules/rankings/queries";
import { Rankings } from "@/components/rankings/Rankings";

export async function UserRankingFetcher({
  organizationId,
  period,
  userId,
}: {
  organizationId: string;
  period: string;
  userId: string;
}) {
  const rankings = await getEmployeeRankings(organizationId, period);
  return <Rankings rankings={rankings} mode='user' currentUserId={userId} />;
}
