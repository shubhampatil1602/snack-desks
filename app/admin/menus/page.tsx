import { requireAdmin } from "@/actions/user";
import { prisma } from "@/lib/db";
import { Suspense } from "react";
import { MenuContentFetcher } from "./_components/MenuFetchers";
import { MenuTableSkeleton } from "./_components/MenuSkeletons";

export default async function MenusPage() {
  const { session } = await requireAdmin();

  const member = await prisma.member.findFirst({
    where: { userId: session.user.id },
  });

  if (!member) {
    return null;
  }

  return (
    <div className='px-4'>
      <h1 className='text-2xl font-heading tracking-wide'>Menus</h1>
      <Suspense fallback={<MenuLoadingFallback />}>
        <MenuContentFetcher organizationId={member.organizationId} />
      </Suspense>
    </div>
  );
}

function MenuLoadingFallback() {
  return (
    <>
      <div className='flex items-center justify-between mb-6'>
        <div>
          <div className='h-5 w-64 bg-muted animate-pulse mt-1' />
        </div>
        <div className='space-x-3 flex'>
          <div className='h-9 sm:w-28 bg-primary/20 animate-pulse' />
          <div className='h-9 sm:w-32 bg-muted animate-pulse' />
          <div className='h-9 sm:w-28 bg-muted animate-pulse' />
        </div>
      </div>
      <MenuTableSkeleton />
    </>
  );
}
