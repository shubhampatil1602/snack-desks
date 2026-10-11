import type { Metadata } from "next";
import { requireAdmin } from "@/actions/user";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "User Management",
  description:
    "View organization members, reset passwords, and manage team permissions.",
};
import { UsersTableFetcher } from "./_components/UserFetchers";
import { UsersTableSkeleton } from "./_components/UserSkeletons";

export default async function UsersPage() {
  const { member } = await requireAdmin();

  return (
    <div className='space-y-6 px-4'>
      <div>
        <h1 className='text-2xl font-heading'>All Users</h1>

        <p className='text-sm text-muted-foreground'>
          List of all users in your current organization
        </p>
      </div>

      <Suspense fallback={<UsersTableSkeleton />}>
        <UsersTableFetcher organizationId={member.organizationId} />
      </Suspense>
    </div>
  );
}
