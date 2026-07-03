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

  return (
    <UsersTable
      organization={{
        name: organization.name,
        slug: organization.slug,
        inviteCode: organization.inviteCode,
        createdAt: organization.createdAt,
        memberCount: organization.members.length,
      }}
      members={organization.members}
    />
  );
}
