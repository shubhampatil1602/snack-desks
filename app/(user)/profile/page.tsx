import { authIsRequired } from "@/actions/user";
import { prisma } from "@/lib/db";
import { getUserOrderHistory } from "@/modules/orders/user-history-queries";
import { SnackHeatmap } from "./_components/SnackHeatMap";
import { getHeatmapData } from "./_lib/get-heatmap-data";

export default async function UserProfilePage() {
  const session = await authIsRequired();

  const orders = await getUserOrderHistory(session.user.id);
  const heatmapData = getHeatmapData(orders);
  const member = await prisma.member.findFirst({
    where: {
      userId: session.user.id,
    },
  });
  if (!member) return null;

  return (
    <div className='px-4 space-y-6'>
      <SnackHeatmap data={heatmapData} />
    </div>
  );
}
