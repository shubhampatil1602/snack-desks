import { requireAdmin } from "@/actions/user";
import { prisma } from "@/lib/db";

import { AdminWindowHistory } from "./_components/AdminWindowHistory";
import { ExportOrdersDialog } from "./_components/ExportOrdersDialog";

import { getOrganizationOrderHistoryGroupedByWindow } from "@/modules/orders/admin-history-queries";
import { getMenuItems } from "@/modules/menu/queries";
import { PaymentQR } from "@/components/payment-qr";

import { PeriodPicker } from "@/components/period-picker";
import { getPeriodCookie } from "@/actions/period-cookie";
import {
  generateMonthsFromDate,
  getPeriodLabel,
  getActivePeriod,
} from "@/lib/period-utils";

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

  const [windows, menuItems] = await Promise.all([
    getOrganizationOrderHistoryGroupedByWindow(member.organizationId, period),
    getMenuItems(member.organizationId),
  ]);

  return (
    <div className='px-4 space-y-6'>
      <div className='flex justify-between items-center pb-4 border-b'>
        <div>
          <h1 className='text-2xl font-heading tracking-wide'>Order History</h1>
          <p className='text-sm text-muted-foreground mt-1'>
            View history of your organization orders{" "}
            {period === "all" ? "of all time" : `in ${periodLabel}`}
          </p>
        </div>
        <div className='flex items-center gap-3'>
          <PaymentQR />
          <ExportOrdersDialog />
          <PeriodPicker
            period={rawPeriod}
            startDate={member.organization?.createdAt || new Date()}
            basePath='/admin/history'
          />
        </div>
      </div>

      <AdminWindowHistory windows={windows} menuItems={menuItems} />
    </div>
  );
}
