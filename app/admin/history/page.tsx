import { requireAdmin } from "@/actions/user";
import { prisma } from "@/lib/db";

import { AdminWindowHistory } from "./_components/AdminWindowHistory";

import { getOrganizationOrderHistoryGroupedByWindow } from "@/modules/orders/admin-history-queries";

export default async function AdminHistoryPage() {
  const { session } = await requireAdmin();

  const member = await prisma.member.findFirst({
    where: {
      userId: session.user.id,
    },
  });

  if (!member) {
    return null;
  }
  const windows = await getOrganizationOrderHistoryGroupedByWindow(
    member.organizationId,
  );

  return (
    <div className='px-4 space-y-6'>
      <div>
        <h1 className='text-2xl font-heading tracking-wide'>Order History</h1>

        <p className='text-sm text-muted-foreground mt-1'>
          View history of your organization orders
        </p>
      </div>

      <AdminWindowHistory windows={windows} />
    </div>
  );
}
