import { authIsRequired } from "@/actions/user";
import { prisma } from "@/lib/db";
import { getUserOrderHistory } from "@/modules/orders/user-history-queries";
import { SnackHeatmap } from "./_components/SnackHeatMap";
import { getHeatmapData } from "./_lib/get-heatmap-data";
import { ProfileHeader } from "./_components/ProfileHeader";
import { FavoriteItemsCard } from "@/app/(user)/dashboard/_components/FavoriteItemsCard";
import { getFavoriteItems } from "./_lib/get-favorite-items";

export default async function UserProfilePage() {
  const session = await authIsRequired();

  const orders = await getUserOrderHistory(session.user.id, "all");
  const heatmapData = getHeatmapData(orders);

  const member = await prisma.member.findFirst({
    where: {
      userId: session.user.id,
    },
    include: {
      organization: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!member) return null;

  const favoriteItems = getFavoriteItems(orders);

  const splitMasterWins = await prisma.orderWindow.count({
    where: {
      organizationId: member.organizationId,
      winnerUserId: session.user.id,
    },
  });

  return (
    <div className='px-4 space-y-6'>
      <ProfileHeader
        user={session.user}
        member={member}
        splitMasterWins={splitMasterWins}
      />
      <SnackHeatmap data={heatmapData} joinedAt={member.createdAt} />
      <FavoriteItemsCard items={favoriteItems} />
    </div>
  );
}
