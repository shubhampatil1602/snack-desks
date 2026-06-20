import { requireAdmin } from "@/actions/user";
import { getEmployeeRankings } from "@/modules/rankings/queries";
import { Rankings } from "@/components/rankings/Rankings";
import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { PeriodPicker } from "@/components/period-picker";

interface AdminRankingsPageProps {
  searchParams: Promise<{
    period?: string;
  }>;
}

export default async function AdminRankingsPage({
  searchParams,
}: AdminRankingsPageProps) {
  const { member } = await requireAdmin();

  const organization = await prisma.organization.findUnique({
    where: {
      id: member.organizationId,
    },
    select: {
      createdAt: true,
    },
  });

  if (!organization) {
    throw new Error("Organization not found");
  }

  const params = await searchParams;
  const period = params.period ?? format(new Date(), "yyyy-MM");

  const rankings = await getEmployeeRankings(member.organizationId, period);

  return (
    <div className='space-y-6 px-4'>
      <div className='flex items-start justify-between gap-4 flex-wrap'>
        <div>
          <h1 className='text-2xl font-heading'>Employee Rankings</h1>
          <p className='text-sm text-muted-foreground'>
            Most active employees based on approved orders.
          </p>
        </div>

        <PeriodPicker
          period={params.period}
          startDate={organization.createdAt}
          basePath='/admin/rankings'
        />
      </div>

      <Rankings rankings={rankings} mode='admin' />
    </div>
  );
}
