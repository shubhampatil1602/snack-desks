import { authIsRequired } from "@/actions/user";
import { prisma } from "@/lib/db";
import {
  getPeriodLabel,
  generateMonthsFromDate,
  getActivePeriod,
} from "@/lib/period-utils";
import { PeriodPicker } from "@/components/period-picker";
import { Suspense } from "react";
import { DashboardSSE } from "@/app/admin/dashboard/_components/DashboardSSE";
import { redirect } from "next/navigation";
import { getActiveWindowWithMenu } from "@/modules/orders/queries";
import { CartSync } from "../_components/cart-sync";
import { getPeriodCookie } from "@/actions/period-cookie";
import {
  UserStatsSkeleton,
  UserRankSkeleton,
  UserRecentOrdersSkeleton,
  UserHeatmapSkeleton,
  UserFavoriteItemsSkeleton,
  ProfileHeaderSkeleton,
} from "./_components/DashboardSkeletons";
import {
  UserStatsFetcher,
  UserRankFetcher,
  UserRecentOrdersFetcher,
  UserHeatmapFetcher,
  UserFavoriteItemsFetcher,
  ProfileHeaderFetcher,
} from "./_components/DashboardFetchers";

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
      organization: {
        select: {
          createdAt: true,
        },
      },
    },
  });

  if (!member) return null;

  const params = await searchParams;
  const cookiePeriod = await getPeriodCookie();
  const rawPeriod = params.period ?? cookiePeriod ?? undefined;
  const period = getActivePeriod(rawPeriod);

  const activeWindow = await getActiveWindowWithMenu(member.organizationId);

  const months = generateMonthsFromDate(member.organization.createdAt);
  const periodLabel = getPeriodLabel(period, months);

  return (
    <div className='space-y-3 px-4'>
      <CartSync hasActiveWindow={!!activeWindow} />

      <div className='flex items-start justify-between gap-4 flex-wrap'>
        <div className='mb-3'>
          <h1 className='text-2xl font-heading tracking-wide'>Dashboard</h1>
          <p className='text-sm text-muted-foreground mt-1'>
            Your personal activity and statistics
          </p>
        </div>

        <PeriodPicker
          period={rawPeriod}
          startDate={member.organization.createdAt}
          basePath='/dashboard'
        />
      </div>

      <Suspense fallback={<ProfileHeaderSkeleton />}>
        <ProfileHeaderFetcher
          user={session.user}
          organizationId={member.organizationId}
          userId={session.user.id}
        />
      </Suspense>

      <DashboardSSE />

      <Suspense fallback={<UserStatsSkeleton />}>
        <UserStatsFetcher
          organizationId={member.organizationId}
          userId={session.user.id}
          period={period}
          periodLabel={periodLabel}
        />
      </Suspense>

      <div className='grid gap-3 lg:grid-cols-2'>
        <Suspense fallback={<UserRankSkeleton />}>
          <UserRankFetcher
            organizationId={member.organizationId}
            userId={session.user.id}
            period={period}
          />
        </Suspense>
        <Suspense fallback={<UserRecentOrdersSkeleton />}>
          <UserRecentOrdersFetcher
            organizationId={member.organizationId}
            userId={session.user.id}
            period={period}
          />
        </Suspense>
      </div>

      <Suspense fallback={<UserHeatmapSkeleton />}>
        <UserHeatmapFetcher
          organizationId={member.organizationId}
          userId={session.user.id}
          joinedAt={member.organization.createdAt}
        />
      </Suspense>

      <Suspense fallback={<UserFavoriteItemsSkeleton />}>
        <UserFavoriteItemsFetcher
          organizationId={member.organizationId}
          userId={session.user.id}
          period={period}
        />
      </Suspense>
    </div>
  );
}
