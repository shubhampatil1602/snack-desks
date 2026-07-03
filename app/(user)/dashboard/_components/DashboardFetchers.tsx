import { UserStatsCards } from "./UserStatsCards";
import { UserRankCard } from "./UserRankCard";
import { RecentOrdersCard } from "./RecentOrdersCard";
import { FavoriteItemsCard } from "./FavoriteItemsCard";
import { SnackHeatmap } from "@/components/SnackHeatMap";
import { ProfileHeader } from "./ProfileHeader";
import {
  getUserStats,
  getUserFavoriteItems,
  getUserRecentOrders,
  getUserHeatmapData,
  getUserSplitMasterWins,
} from "@/modules/user-dashboard/queries";
import { prisma } from "@/lib/db";

export async function UserStatsFetcher({
  organizationId,
  userId,
  period,
  periodLabel,
}: {
  organizationId: string;
  userId: string;
  period: string;
  periodLabel: string;
}) {
  const stats = await getUserStats(organizationId, userId, period);
  return <UserStatsCards stats={stats} periodLabel={periodLabel} />;
}

export async function UserRankFetcher({
  organizationId,
  userId,
  period,
}: {
  organizationId: string;
  userId: string;
  period: string;
}) {
  const stats = await getUserStats(organizationId, userId, period);
  return <UserRankCard rank={stats.currentRank} />;
}

export async function UserRecentOrdersFetcher({
  organizationId,
  userId,
  period,
}: {
  organizationId: string;
  userId: string;
  period: string;
}) {
  const recentOrders = await getUserRecentOrders(organizationId, userId, period);
  return <RecentOrdersCard orders={recentOrders} />;
}

export async function UserFavoriteItemsFetcher({
  organizationId,
  userId,
  period,
}: {
  organizationId: string;
  userId: string;
  period: string;
}) {
  const items = await getUserFavoriteItems(organizationId, userId, period);
  return <FavoriteItemsCard items={items} />;
}

export async function UserHeatmapFetcher({
  organizationId,
  userId,
  joinedAt,
}: {
  organizationId: string;
  userId: string;
  joinedAt: Date;
}) {
  const data = await getUserHeatmapData(organizationId, userId);
  return <SnackHeatmap data={data} joinedAt={joinedAt} />;
}

export async function ProfileHeaderFetcher({
  user,
  organizationId,
  userId,
}: {
  user: { id: string; name: string; email: string };
  organizationId: string;
  userId: string;
}) {
  const member = await prisma.member.findFirst({
    where: { userId, organizationId },
    include: {
      user: true,
      organization: { select: { name: true, createdAt: true } },
    },
  });

  if (!member) return null;

  const splitMasterWins = await getUserSplitMasterWins(organizationId, userId);

  return (
    <ProfileHeader 
      user={user} 
      member={member} 
      splitMasterWins={splitMasterWins} 
    />
  );
}
