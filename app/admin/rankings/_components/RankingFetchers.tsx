import { getEmployeeRankings } from "@/modules/rankings/queries";
import { Rankings } from "@/components/rankings/Rankings";

export async function RankingFetcher({ organizationId, period }: { organizationId: string; period: string }) {
  const rankings = await getEmployeeRankings(organizationId, period);
  return <Rankings rankings={rankings} mode='admin' />;
}
