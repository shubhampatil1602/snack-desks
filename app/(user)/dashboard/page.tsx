import { authIsRequired } from "@/actions/user";
import { prisma } from "@/lib/db";
import { getUserDashboardData } from "@/modules/user-dashboard/queries";

import { UserStatsCards } from "./_components/UserStatsCards";
import { UserRankCard } from "./_components/UserRankCard";
import { RecentOrdersCard } from "./_components/RecentOrdersCard";
import { FavoriteItemsCard } from "./_components/FavoriteItemsCard";
import { DashboardSSE } from "@/app/admin/dashboard/_components/DashboardSSE";
import { redirect } from "next/navigation";
import { getActiveWindowWithMenu } from "@/modules/orders/queries";
import { CartSync } from "../_components/cart-sync";

export default async function UserDashboard() {
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
  });

  if (!member) return null;

  const data = await getUserDashboardData(
    member.organizationId,
    session.user.id,
  );

  const activeWindow = await getActiveWindowWithMenu(member.organizationId);
  return (
    <div className='space-y-6 px-4'>
      <CartSync hasActiveWindow={!!activeWindow} />
      <div>
        <h1 className='text-2xl font-heading tracking-wide'>
          Hello, {session.user.name}
        </h1>

        <p className='text-sm text-muted-foreground mt-1'>
          You&apos;ve placed {data.stats.totalOrders} orders and spent ₹
          {data.stats.totalSpent.toFixed(2)} so far.
        </p>
      </div>
      <DashboardSSE />
      <UserStatsCards stats={data.stats} />
      <div className='grid gap-3 lg:grid-cols-2'>
        <UserRankCard rank={data.rank} />

        <RecentOrdersCard orders={data.recentOrders} />
      </div>
      <FavoriteItemsCard items={data.favoriteItems} />
    </div>
  );
}
