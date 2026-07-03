import { authIsRequired } from "@/actions/user";
import { prisma } from "@/lib/db";
import { Suspense } from "react";
import { OrderWindowFetcher } from "./_components/OrderWindowFetchers";
import { OrderWindowSkeleton } from "./_components/OrderWindowSkeletons";

export default async function OrderWindowPage() {
  const session = await authIsRequired();

  const member = await prisma.member.findFirst({
    where: { userId: session.user.id },
  });

  if (!member) return null;

  return (
    <div className='px-4 space-y-6'>
      <Suspense fallback={<OrderWindowSkeleton />}>
        <OrderWindowFetcher
          organizationId={member.organizationId}
          userId={session.user.id}
        />
      </Suspense>
    </div>
  );
}
