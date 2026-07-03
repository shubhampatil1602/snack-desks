import { requireAdmin } from "@/actions/user";
import { prisma } from "@/lib/db";
import { Suspense } from "react";
import { OrderWindowContentFetcher } from "./_components/OrderWindowFetchers";
import { OrderWindowContentSkeleton } from "./_components/OrderWindowSkeletons";

export default async function AdminOrderWindowPage() {
  const { session } = await requireAdmin();

  const member = await prisma.member.findFirst({
    where: { userId: session.user.id },
  });

  if (!member) {
    return null;
  }

  return (
    <div className='px-4 space-y-6'>
      <div>
        <h1 className='text-2xl font-heading tracking-wide'>Orders</h1>
        <p className='text-sm text-muted-foreground mt-1'>
          Manage order windows and live orders
        </p>
      </div>

      <Suspense fallback={<OrderWindowContentSkeleton />}>
        <OrderWindowContentFetcher organizationId={member.organizationId} />
      </Suspense>
    </div>
  );
}
