import { requireAdmin } from "@/actions/user";
import { prisma } from "@/lib/db";
import { Suspense } from "react";

import { ExportOrdersDialog } from "./_components/ExportOrdersDialog";
import { PaymentQR } from "@/components/payment-qr";
import { PeriodPicker } from "@/components/period-picker";
import { getPeriodCookie } from "@/actions/period-cookie";
import {
  generateMonthsFromDate,
  getPeriodLabel,
  getActivePeriod,
} from "@/lib/period-utils";

import { AdminWindowHistoryFetcher } from "./_components/HistoryFetchers";
import { AdminWindowHistorySkeleton } from "./_components/HistorySkeletons";

interface AdminHistoryPageProps {
  searchParams: Promise<{
    period?: string;
  }>;
}

export default async function AdminHistoryPage({
  searchParams,
}: AdminHistoryPageProps) {
  const { session } = await requireAdmin();

  const params = await searchParams;
  const cookiePeriod = await getPeriodCookie();
  const rawPeriod = params.period ?? cookiePeriod ?? undefined;
  const period = getActivePeriod(rawPeriod);

  const member = await prisma.member.findFirst({
    where: {
      userId: session.user.id,
    },
    include: {
      organization: {
        select: {
          createdAt: true,
        },
      },
    },
  });

  if (!member) {
    return null;
  }

  const months = generateMonthsFromDate(member.organization.createdAt);
  const periodLabel = getPeriodLabel(period, months);

  return (
    <div className='px-4 space-y-6'>
      <div className='flex flex-col md:flex-row md:items-center justify-between pb-4 border-b gap-4'>
        <div>
          <h1 className='text-2xl font-heading tracking-wide'>Order History</h1>
          <p className='text-sm text-muted-foreground mt-1'>
            View history of your organization orders{" "}
            {period === "all" ? "of all time" : `in ${periodLabel}`}
          </p>
        </div>
        <div className='flex items-center flex-wrap gap-3'>
          <PaymentQR />
          <ExportOrdersDialog />
          <PeriodPicker
            period={rawPeriod}
            startDate={member.organization?.createdAt || new Date()}
            basePath='/admin/history'
          />
        </div>
      </div>

      <Suspense fallback={<AdminWindowHistorySkeleton />}>
        <AdminWindowHistoryFetcher
          organizationId={member.organizationId}
          period={period}
          periodLabel={periodLabel}
        />
      </Suspense>
    </div>
  );
}
