import { prisma } from "@/lib/db";
import { UsersTable } from "./UsersTable";

export async function UsersTableFetcher({ organizationId }: { organizationId: string }) {
  const organization = await prisma.organization.findUnique({
    where: {
      id: organizationId,
    },
    select: {
      name: true,
      slug: true,
      createdAt: true,
      inviteCode: true,
      members: {
        where: {
          role: "member",
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true,
              passwordResetExpiry: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!organization) return null;

  const winCounts = await prisma.orderWindow.groupBy({
    by: ["winnerUserId"],
    where: {
      organizationId,
      winnerUserId: { not: null },
    },
    _count: { _all: true },
  });

  const winsByUserId = new Map(
    winCounts.map((row) => [row.winnerUserId!, row._count._all]),
  );

  return (
    <UsersTable
      organization={{
        name: organization.name,
        slug: organization.slug,
        inviteCode: organization.inviteCode,
        createdAt: organization.createdAt,
        memberCount: organization.members.length,
      }}
      members={organization.members.map((member) => ({
        ...member,
        orderWindowWins: winsByUserId.get(member.user.id) ?? 0,
      }))}
    />
  );
}
