import { requireAdmin } from "@/actions/user";
import { prisma } from "@/lib/db";
import { UsersTable } from "./_components/UsersTable";

export default async function UsersPage() {
  const { member } = await requireAdmin();

  const organization = await prisma.organization.findUnique({
    where: {
      id: member.organizationId,
    },
    select: {
      inviteCode: true,
      members: {
        where: {
          role: "member",
        },
        include: {
          user: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!organization) return null;

  return (
    <div className='space-y-6 px-4'>
      <div>
        <h1 className='text-2xl font-heading'>All Users</h1>

        <p className='text-sm text-muted-foreground'>
          List of all users in your current organization
        </p>
      </div>

      <UsersTable
        inviteCode={organization.inviteCode}
        members={organization.members}
      />
    </div>
  );
}
