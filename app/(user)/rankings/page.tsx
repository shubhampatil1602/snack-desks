import { authIsRequired } from "@/actions/user";
import { prisma } from "@/lib/db";
import { getEmployeeRankings } from "@/modules/rankings/queries";
import { Rankings } from "@/components/rankings/Rankings";
import { getActiveWindowWithMenu } from "@/modules/orders/queries";
import { CartSync } from "../_components/cart-sync";
import { format } from "date-fns";
import { PeriodPicker } from "@/components/period-picker";

interface RankingsPageProps {
  searchParams: Promise<{
    period?: string;
  }>;
}

export default async function RankingsPage({
  searchParams,
}: RankingsPageProps) {
  const session = await authIsRequired();

  const member = await prisma.member.findFirst({
    where: {
      userId: session.user.id,
    },
    include: {
      user: true,
    },
  });

  if (!member) return null;

  const params = await searchParams;
  const period = params.period ?? format(new Date(), "yyyy-MM");

  const rankings = await getEmployeeRankings(member.organizationId, period);

  const activeWindow = await getActiveWindowWithMenu(member.organizationId);

  return (
    <div className='space-y-6 px-4'>
      <CartSync hasActiveWindow={!!activeWindow} />

      <div className='flex items-start justify-between gap-4 flex-wrap'>
        <div>
          <h1 className='text-2xl font-heading'>Rankings</h1>
          <p className='text-sm text-muted-foreground'>
            See how you compare with your coworkers.
          </p>
        </div>

        <PeriodPicker
          period={params.period}
          startDate={member.createdAt}
          basePath='/rankings'
        />
      </div>

      <Rankings
        rankings={rankings}
        mode='user'
        currentUserId={session.user.id}
      />
    </div>
  );
}
