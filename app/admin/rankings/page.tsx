import { requireAdmin } from "@/actions/user";
import { getEmployeeRankings } from "@/modules/rankings/queries";
import { Rankings } from "@/components/rankings/Rankings";

import { prisma } from "@/lib/db";
import { PeriodPicker } from "@/components/period-picker";
import { getPeriodCookie } from "@/actions/period-cookie";
import {
  generateMonthsFromDate,
  getPeriodLabel,
  getActivePeriod,
} from "@/lib/period-utils";

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
  const cookiePeriod = await getPeriodCookie();
  const rawPeriod = params.period ?? cookiePeriod ?? undefined;
  const period = getActivePeriod(rawPeriod);

  const months = generateMonthsFromDate(organization.createdAt);
  const periodLabel = getPeriodLabel(period, months);

  const rankings = await getEmployeeRankings(member.organizationId, period);

  return (
    <div className='space-y-6 px-4'>
      <div className='flex items-start justify-between gap-4 flex-wrap'>
        <div>
          <h1 className='text-2xl font-heading'>Employee Rankings</h1>
          <p className='text-sm text-muted-foreground'>
            Most active employees based on approved orders{" "}
            {period === "all" ? "of all time" : `in ${periodLabel}`}.
          </p>
        </div>

        <PeriodPicker
          period={rawPeriod}
          startDate={organization.createdAt}
          basePath='/admin/rankings'
        />
      </div>

      <Rankings rankings={rankings} mode='admin' />
    </div>
  );
}
