import { authIsRequired } from "@/actions/user";

export default async function UserDashboard() {
  const session = await authIsRequired();

  return (
    <div className='space-y-8 px-4'>
      <div>
        <h1 className='text-2xl font-heading tracking-wide'>
          Hello, {session.user.name}
        </h1>
        <p className='text-sm text-muted-foreground mt-1'>
          Here&apos;s what&apos;s happening across your organization.
        </p>
      </div>
    </div>
  );
}
