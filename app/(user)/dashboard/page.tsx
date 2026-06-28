import { authIsRequired } from "@/actions/user";
import { prisma } from "@/lib/db";
import { getUserDashboardData } from "@/modules/user-dashboard/queries";
import {
  getPeriodLabel,
  generateMonthsFromDate,
  getActivePeriod,
} from "@/lib/period-utils";
import { PeriodPicker } from "@/components/period-picker";

import { UserStatsCards } from "./_components/UserStatsCards";
import { UserRankCard } from "./_components/UserRankCard";
import { RecentOrdersCard } from "./_components/RecentOrdersCard";
import { FavoriteItemsCard } from "./_components/FavoriteItemsCard";
import { ProfileHeader } from "./_components/ProfileHeader";
import { SnackHeatmap } from "@/components/SnackHeatMap";
import { DashboardSSE } from "@/app/admin/dashboard/_components/DashboardSSE";
import { redirect } from "next/navigation";
import { getActiveWindowWithMenu } from "@/modules/orders/queries";
import { CartSync } from "../_components/cart-sync";

interface UserDashboardProps {
  searchParams: Promise<{
    period?: string;
  }>;
}

export default async function UserDashboard({
  searchParams,
}: UserDashboardProps) {
  const session = await authIsRequired();

  if (session.user.role === "admin") {
    redirect("/admin/dashboard");
  }

  if (session.user.role === "super_admin") {
    redirect("/super-admin/dashboard");
  }

  const member = await prisma.member.findFirst({
    where: {
      userId: session.user.id,
    },
    include: {
      user: true,
      organization: {
        select: {
          name: true,
          createdAt: true,
        },
      },
    },
  });

  if (!member) return null;

  const params = await searchParams;
  const period = getActivePeriod(params.period);

  const data = await getUserDashboardData(
    member.organizationId,
    session.user.id,
    period,
  );

  const activeWindow = await getActiveWindowWithMenu(member.organizationId);

  const months = generateMonthsFromDate(member.organization.createdAt);
  const periodLabel = getPeriodLabel(period, months);

  return (
    <div className='space-y-3 px-4'>
      <CartSync hasActiveWindow={!!activeWindow} />

      <div className='flex items-start justify-between gap-4 flex-wrap'>
        <div className='mb-3'>
          <h1 className='text-2xl font-heading tracking-wide'>
            Dashboard
          </h1>
          <p className='text-sm text-muted-foreground mt-1'>
            Your personal activity and statistics
          </p>
        </div>

        <PeriodPicker
          period={params.period}
          startDate={member.organization.createdAt}
          basePath='/dashboard'
        />
      </div>

      <ProfileHeader 
        user={session.user} 
        member={member} 
        splitMasterWins={data.splitMasterWins} 
      />

      <DashboardSSE />
      <UserStatsCards stats={data.stats} periodLabel={periodLabel} />
      <div className='grid gap-3 lg:grid-cols-2'>
        <UserRankCard rank={data.rank} />
        <RecentOrdersCard orders={data.recentOrders} />
      </div>
      <SnackHeatmap data={data.heatmapData} joinedAt={member.organization.createdAt} />
      <FavoriteItemsCard items={data.favoriteItems} />
    </div>
  );
}
