// app/rankings/page.tsx

import { authIsRequired } from "@/actions/user";
import { prisma } from "@/lib/db";
import { getEmployeeRankings } from "@/modules/rankings/queries";
import { Rankings } from "@/components/rankings/Rankings";

export default async function RankingsPage() {
  const session = await authIsRequired();

  const member = await prisma.member.findFirst({
    where: {
      userId: session.user.id,
    },
  });

  if (!member) return null;

  const rankings = await getEmployeeRankings(member.organizationId);

  return (
    <div className='space-y-6 px-4'>
      <div>
        <h1 className='text-2xl font-heading'>Rankings</h1>

        <p className='text-sm text-muted-foreground'>
          See how you compare with your coworkers.
        </p>
      </div>

      <Rankings
        rankings={rankings}
        mode='user'
        currentUserId={session.user.id}
      />
    </div>
  );
}
