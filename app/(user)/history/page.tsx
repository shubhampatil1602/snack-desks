import { authIsRequired } from "@/actions/user";
import { UserHistoryTable } from "./_components/UserHistoryTable";
import { getUserOrderHistory } from "@/modules/orders/user-history-queries";
import { PaymentQR } from "@/components/payment-qr";
import { getActiveWindowWithMenu } from "@/modules/orders/queries";
import { CartSync } from "../_components/cart-sync";
import { prisma } from "@/lib/db";

import { PeriodPicker } from "@/components/period-picker";

import {
  generateMonthsFromDate,
  getPeriodLabel,
  getActivePeriod,
} from "@/lib/period-utils";
import { getPeriodCookie } from "@/actions/period-cookie";

interface OrderHistoryPageProps {
  searchParams: Promise<{
    period?: string;
  }>;
}

export default async function OrderHistoryPage({
  searchParams,
}: OrderHistoryPageProps) {
  const session = await authIsRequired();

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

  if (!member) return null;

  // Pass period to the query
  const orders = await getUserOrderHistory(session.user.id, period);

  const months = generateMonthsFromDate(member.organization.createdAt);
  const periodLabel = getPeriodLabel(period, months);

  const activeWindow = await getActiveWindowWithMenu(member.organizationId);

  return (
    <div className='px-4 space-y-6'>
      <CartSync hasActiveWindow={!!activeWindow} />

      <div className='flex justify-between items-center pb-4 border-b flex-wrap gap-4'>
        <div>
          <h1 className='text-2xl font-heading tracking-wide'>Order History</h1>
          <p className='text-sm text-muted-foreground mt-1'>
            View your previous orders{" "}
            {period === "all" ? "of all time" : `in ${periodLabel}`}
          </p>
        </div>

        <div className='flex items-center gap-3'>
          <PaymentQR />
          <PeriodPicker
            period={rawPeriod}
            startDate={member.organization.createdAt}
            basePath='/history'
          />
        </div>
      </div>

      <UserHistoryTable orders={orders} />
    </div>
  );
}
