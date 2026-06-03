import { requireAdmin } from "@/actions/user";
import { getEmployeeRankings } from "@/modules/rankings/queries";
import { Rankings } from "@/components/rankings/Rankings";

export default async function AdminRankingsPage() {
  const { member } = await requireAdmin();

  const rankings = await getEmployeeRankings(member.organizationId);

  return (
    <div className='space-y-6 px-4'>
      <div>
        <h1 className='text-2xl font-heading'>Employee Rankings</h1>

        <p className='text-sm text-muted-foreground'>
          Most active employees based on approved orders.
        </p>
      </div>

      <Rankings rankings={rankings} mode='admin' />
    </div>
  );
}
