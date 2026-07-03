import { UsersTableSkeleton } from "./_components/UserSkeletons";

export default function UsersLoading() {
  return (
    <div className='space-y-6 px-4 w-full'>
      <div>
        <h1 className='text-2xl font-heading'>All Users</h1>

        <p className='text-sm text-muted-foreground'>
          List of all users in your current organization
        </p>
      </div>

      <UsersTableSkeleton />
    </div>
  );
}
